"use client";

import { useEffect, useRef } from "react";
import {
  FILM_TIERS,
  type TierName,
  frameUrl,
  frameToIndex,
  focusAt,
  TOTAL_FRAMES,
} from "@/lib/film";
import {
  getFilmManifest,
  getTier,
  getFrameURL,
  frameCountFor,
  frameBytes as manifestFrameBytes,
  resolveAvailableTier,
  nextTierDown,
  type FilmManifest,
  type ManifestTier,
} from "@/lib/film-manifest";

/**
 * The projector.
 *
 * Scroll writes a target frame into a ref; a single requestAnimationFrame loop
 * paints the nearest available frame. Nothing here touches React state while
 * the visitor is scrolling — that was the old implementation's jank: a setState
 * per scroll tick meant ~24 component re-renders a second.
 *
 * The loader keeps a sliding window around the playhead rather than the whole
 * reel. Measured on mobile: loading everything put ~580 decodes on the main
 * thread inside the critical window and pushed LCP to 9.3 s, of which 8861 ms
 * was render delay — for a text LCP element that needed no network at all.
 * Deferring the start recovered 4.6 s; bounding the working set is the other
 * half, and it is what keeps memory flat on a long scroll.
 */

const LADDER_STEP = 12;

/** Frames kept either side of the playhead. Ahead is cheaper than behind. */
const WINDOW_AHEAD = 20;
const WINDOW_BEHIND = 40;

/** Consecutive genuine decode failures before stepping down a tier. */
const FAILURE_THRESHOLD = 6;

/** Bytes per decoded frame, by tier — width × height × 4 (RGBA). */
const FRAME_BYTES: Record<TierName, number> = {
  hd: 1600 * 900 * 4,
  sd: 960 * 540 * 4,
};

interface DeviceProfile {
  concurrency: number;
  memoryBudget: number;
}

/**
 * Decode concurrency and memory budget, sized to the device.
 *
 * Six parallel decodes suits a desktop with cores to spare and starves a phone,
 * where the same six compete with the main thread for the paint the visitor is
 * waiting on. Cores and memory refine the viewport guess — a wide window on a
 * weak machine is still a weak machine — and only ever lower the result.
 */
function profileDevice(): DeviceProfile {
  if (typeof window === "undefined") {
    return { concurrency: 6, memoryBudget: 250 * 1024 * 1024 };
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;

  const mobile = window.matchMedia("(max-width: 768px)").matches;
  const tablet = !mobile && window.matchMedia("(max-width: 1024px)").matches;

  let concurrency = mobile ? 2 : tablet ? 4 : 6;
  let memoryBudget = (mobile ? 80 : tablet ? 150 : 250) * 1024 * 1024;

  if (cores <= 4 || memory <= 4) {
    concurrency = Math.min(concurrency, mobile ? 2 : 4);
    memoryBudget = Math.min(memoryBudget, 150 * 1024 * 1024);
  }

  // Ultra-low end, or a connection that has told us to be frugal.
  const frugal = Boolean(nav.connection?.saveData);
  if (cores <= 2 || memory <= 2 || frugal) {
    concurrency = 1;
    memoryBudget = Math.min(memoryBudget, 60 * 1024 * 1024);
  }

  return { concurrency, memoryBudget };
}

/** A decoded frame, in whichever form the platform gave us. */
type Decoded = ImageBitmap | HTMLImageElement;

function disposeDecoded(d: Decoded) {
  // ImageBitmap holds GPU-adjacent memory the GC will not reclaim promptly.
  if (typeof ImageBitmap !== "undefined" && d instanceof ImageBitmap) d.close();
}

function widthOf(d: Decoded) {
  return d instanceof HTMLImageElement ? d.naturalWidth : d.width;
}
function heightOf(d: Decoded) {
  return d instanceof HTMLImageElement ? d.naturalHeight : d.height;
}

export interface FilmEngineHandle {
  /** Called by ScrollTrigger. Cheap: a ref write. */
  setFrame: (frame: number) => void;
}

export function useFilmEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  opts: {
    onFirstPaint?: () => void;
    onLoadProgress?: (fraction: number) => void;
  } = {}
): FilmEngineHandle {
  const targetFrame = useRef(1);
  const handle = useRef<FilmEngineHandle>({
    setFrame: (f: number) => {
      targetFrame.current = f;
    },
  });
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── tier selection ────────────────────────────────────────────────
    // Narrow viewports crop hard anyway, and mobile data is precious: the sd
    // ladder is a quarter of the bytes for a quarter of the pixels.
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const saveData = Boolean(nav.connection?.saveData);
    const slow = /2g/.test(nav.connection?.effectiveType ?? "");
    const legacyTier: TierName =
      window.innerWidth < 900 || saveData || slow ? "sd" : "hd";

    const { concurrency, memoryBudget } = profileDevice();

    /**
     * Source of frame URLs. Legacy until the manifest resolves, and permanently
     * legacy if it never does — a missing manifest must not blank the canvas.
     * Only the URL source and the frame count change; scheduling, prediction,
     * eviction and cancellation are untouched by which mode is active.
     */
    let manifest: FilmManifest | null = null;
    let mTier: ManifestTier | null = null;
    let count: number = FILM_TIERS[legacyTier].count;
    let maxFrames: number = Math.max(
      24,
      Math.floor(memoryBudget / FRAME_BYTES[legacyTier])
    );

    const urlFor = (idx: number): string | null =>
      manifest && mTier ? getFrameURL(manifest, mTier, idx) : frameUrl(idx, legacyTier);

    /**
     * Film frame → tier index.
     *
     * Legacy ladders are decimated (hd every 2nd master, sd every 4th), so the
     * mapping lives in lib/film.ts. Manifest tiers encode every master, so the
     * ratio is derived from the tier's own frame count. Choreography is
     * untouched either way: the same film frame maps to the same moment.
     */
    const toIndex = (frame: number): number =>
      manifest && mTier
        ? Math.min(count, Math.max(1, Math.round((frame * count) / TOTAL_FRAMES)))
        : frameToIndex(frame, legacyTier);

    let disposed = false;
    let firstPainted = false;
    let loadedEver = 0;

    // ── LRU cache ─────────────────────────────────────────────────────
    // A Map iterates in insertion order, so re-inserting on read is enough to
    // make the first key the least recently used. No second structure needed.
    const cache = new Map<number, Decoded>();

    const touch = (idx: number): Decoded | undefined => {
      const hit = cache.get(idx);
      if (hit) {
        cache.delete(idx);
        cache.set(idx, hit);
      }
      return hit;
    };

    const evictTo = (limit: number) => {
      while (cache.size > limit) {
        const oldest = cache.keys().next();
        if (oldest.done) break;
        const victim = cache.get(oldest.value);
        cache.delete(oldest.value);
        if (victim) disposeDecoded(victim);
      }
    };

    // ── window + prediction ───────────────────────────────────────────
    let playhead = 1;
    let lastPlayhead = playhead;
    let direction = 1; // +1 forward, -1 backward

    const windowLo = () =>
      Math.max(1, playhead - (direction > 0 ? WINDOW_BEHIND : WINDOW_AHEAD));
    const windowHi = () =>
      Math.min(count, playhead + (direction > 0 ? WINDOW_AHEAD : WINDOW_BEHIND));

    const inWindow = (idx: number) => idx >= windowLo() && idx <= windowHi();

    // ── loading queue ─────────────────────────────────────────────────
    const pending = new Map<number, AbortController>();
    let queue: number[] = [];
    let inFlight = 0;
    let failures = 0;

    const enqueue = (idx: number) => {
      if (idx < 1 || idx > count) return;
      if (cache.has(idx) || pending.has(idx) || queue.includes(idx)) return;
      queue.push(idx);
    };

    /**
     * Cancel work that has fallen outside the window.
     *
     * Without this, a fast scrub leaves dozens of in-flight requests for frames
     * the visitor has already passed, and they arrive to compete with the ones
     * that are now on screen.
     */
    const cancelStale = () => {
      for (const [idx, controller] of pending) {
        if (!inWindow(idx)) {
          controller.abort();
          pending.delete(idx);
        }
      }
      queue = queue.filter(inWindow);
    };

    const decode = async (idx: number, signal: AbortSignal): Promise<Decoded> => {
      const url = urlFor(idx);
      if (!url) throw new Error(`frame ${idx}: no url`);

      // createImageBitmap decodes off the main thread; this is the whole
      // reason the fetch path exists rather than a bare <img>.
      if (typeof createImageBitmap === "function") {
        const res = await fetch(url, { signal, cache: "force-cache" });
        if (!res.ok) throw new Error(`frame ${idx}: ${res.status}`);
        const blob = await res.blob();
        if (signal.aborted) throw new DOMException("aborted", "AbortError");
        return await createImageBitmap(blob);
      }

      const img = new Image();
      img.decoding = "async";
      img.src = url;
      try {
        await img.decode();
        return img;
      } catch {
        // Safari rejects decode() for images that still paint fine.
        if (img.complete && img.naturalWidth > 0) return img;
        throw new Error(`frame ${idx}: decode failed`);
      }
    };

    const pump = () => {
      if (disposed) return;
      cancelStale();

      while (inFlight < concurrency && queue.length) {
        // Always serve whatever is closest to where the visitor actually is,
        // biased in the direction of travel.
        let bestPos = 0;
        let bestCost = Infinity;
        for (let i = 0; i < queue.length; i++) {
          const delta = queue[i] - playhead;
          const behind = delta * direction < 0;
          const cost = Math.abs(delta) * (behind ? 3 : 1);
          if (cost < bestCost) {
            bestCost = cost;
            bestPos = i;
          }
        }
        const idx = queue.splice(bestPos, 1)[0];
        if (cache.has(idx) || pending.has(idx)) continue;

        const controller = new AbortController();
        pending.set(idx, controller);
        inFlight++;

        decode(idx, controller.signal)
          .then((decoded) => {
            if (disposed || !pending.has(idx)) {
              disposeDecoded(decoded);
              return;
            }
            cache.set(idx, decoded);
            evictTo(maxFrames);
            loadedEver++;
            optsRef.current.onLoadProgress?.(Math.min(1, loadedEver / count));
          })
          .catch(() => {
            // Aborted or failed. A failed frame is re-enqueued only while it is
            // still wanted; nearest() covers the gap meanwhile.
            if (disposed) return;
            if (!controller.signal.aborted) failures++;

            // A tier that keeps failing will keep failing on this connection.
            // Step down once, refill, and carry on — never restart playback,
            // never clear the canvas, never upgrade again this session.
            if (manifest && mTier && failures >= FAILURE_THRESHOLD) {
              const next = nextTierDown(mTier);
              const resolved = next ? resolveAvailableTier(manifest, next) : null;
              if (resolved && resolved !== mTier) {
                mTier = resolved;
                count = frameCountFor(manifest, resolved);
                maxFrames = Math.max(
                  24,
                  Math.floor(memoryBudget / (manifestFrameBytes(manifest, resolved) || 1))
                );
                failures = 0;
                queue = [];
                fillWindow();
                return;
              }
            }
            if (inWindow(idx)) enqueue(idx);
          })
          .finally(() => {
            pending.delete(idx);
            inFlight--;
            if (!disposed) pump();
          });
      }
    };

    /** Refill the queue for the current window, nearest first. */
    const fillWindow = () => {
      if (disposed) return;
      const lo = windowLo();
      const hi = windowHi();
      for (let d = 0; d <= hi - lo; d++) {
        const fwd = playhead + d * direction;
        const back = playhead - d * direction;
        if (fwd >= lo && fwd <= hi) enqueue(fwd);
        if (back >= lo && back <= hi) enqueue(back);
      }
      pump();
    };

    // ── first paint has absolute priority ─────────────────────────────
    // The queue is built synchronously; only fetching is deferred. Two rAFs
    // guarantee the browser has committed a frame, then idle time carries the
    // decode. Nothing is dropped — the opening is ready long before a visitor
    // can scroll to it.
    const idle = (fn: () => void, timeout: number) => {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(() => !disposed && fn(), { timeout });
      } else {
        window.setTimeout(() => !disposed && fn(), 120);
      }
    };

    /**
     * Activate manifest mode if a manifest is available.
     *
     * Runs inside the deferred bootstrap, so the 1500 ms fetch timeout can
     * never delay first paint. Any failure leaves the legacy fields untouched
     * and the loader continues exactly as it does today.
     */
    const activateManifest = async () => {
      try {
        const m = await getFilmManifest();
        if (disposed || !m) return;
        const resolved = resolveAvailableTier(m, getTier());
        if (!resolved) return;
        const n = frameCountFor(m, resolved);
        if (!n) return;

        manifest = m;
        mTier = resolved;
        count = n;
        maxFrames = Math.max(
          24,
          Math.floor(memoryBudget / (manifestFrameBytes(m, resolved) || 1))
        );
      } catch {
        // Permanent legacy mode. Never throw from bootstrap.
      }
    };

    const bootstrap = () => {
      // A sparse ladder so a fast scrub always finds something to show, then
      // the dense window around the opening.
      for (let i = 1; i <= count; i += LADDER_STEP * 4) enqueue(i);
      enqueue(count);
      fillWindow();
    };

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
          if (!disposed) {
          idle(() => {
            void activateManifest().then(() => {
              if (!disposed) bootstrap();
            });
          }, 600);
        }
      })
    );

    // ── painting ──────────────────────────────────────────────────────
    const ctx = canvas.getContext("2d", { alpha: false });
    let lastDrawn = -1;
    let lastW = 0;
    let lastH = 0;
    let raf = 0;
    let sinceRefill = 0;

    const nearest = (idx: number): Decoded | undefined => {
      const exact = touch(idx);
      if (exact) return exact;
      for (let d = 1; d <= LADDER_STEP * 4; d++) {
        const lo = touch(idx - d);
        if (lo) return lo;
        const hi = touch(idx + d);
        if (hi) return hi;
      }
      return undefined;
    };

    const paint = () => {
      raf = requestAnimationFrame(paint);
      if (!ctx) return;

      const frame = Math.min(TOTAL_FRAMES, Math.max(1, targetFrame.current));
      const idx = toIndex(frame);

      if (idx !== playhead) {
        const delta = idx - lastPlayhead;
        if (delta !== 0) direction = delta > 0 ? 1 : -1;
        lastPlayhead = playhead;
        playhead = idx;

        // Refilling on every tick would rebuild the queue 60 times a second.
        if (++sinceRefill >= 4) {
          sinceRefill = 0;
          fillWindow();
        }
      }

      const cw = canvas.width;
      const ch = canvas.height;
      if (!cw || !ch) return;

      // Redraw only when the frame, the size, or the DPR actually changed.
      if (idx === lastDrawn && cw === lastW && ch === lastH) return;

      const img = nearest(idx);
      if (!img) return;

      const iw = widthOf(img);
      const ih = heightOf(img);
      if (!iw || !ih) return;

      // cover-fit, biased to the scene's focal point so portrait crops keep
      // the subject rather than slicing through it
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const fx = focusAt(frame);
      let dx = cw / 2 - fx * dw;
      let dy = ch / 2 - 0.5 * dh;
      dx = Math.min(0, Math.max(cw - dw, dx));
      dy = Math.min(0, Math.max(ch - dh, dy));

      ctx.drawImage(img, dx, dy, dw, dh);
      lastDrawn = idx;
      lastW = cw;
      lastH = ch;

      if (!firstPainted) {
        firstPainted = true;
        optsRef.current.onFirstPaint?.();
      }
    };

    // ── sizing ────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      lastDrawn = -1; // force a repaint at the new size
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("orientationchange", resize, { passive: true });

    raf = requestAnimationFrame(paint);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      for (const controller of pending.values()) controller.abort();
      pending.clear();
      queue = [];
      for (const decoded of cache.values()) disposeDecoded(decoded);
      cache.clear();
    };
  }, [canvasRef]);

  return handle.current;
}
