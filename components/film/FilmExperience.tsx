"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useFilmEngine } from "./useFilmEngine";
import {
  SCENES,
  MARKERS,
  CHAPTERS,
  FILM_IN,
  progressToFrame,
  frameToProgress,
  sceneEnvelope,
  sceneProgress,
  type FilmScene,
} from "@/lib/film";

gsap.registerPlugin(ScrollTrigger);

/** How much scroll the film occupies. 800% ≈ 240 frames per viewport height. */
const SCROLL_LENGTH = "+=800%";

/* ── scrim geometry ───────────────────────────────────────────────────
 * Desktop honours each scene's safe zone (positioning lives in globals.css,
 * keyed by data-anchor). Below 768px the frame is cropped to portrait, where
 * left/right anchoring is meaningless and collides with the subject — so
 * every scene collapses to a bottom-anchored block with a stronger bottom
 * scrim. Same words, composition-appropriate placement.  */
const scrimStyle: Record<FilmScene["scrim"], string> = {
  left: "linear-gradient(100deg, rgba(24,38,26,.88) 0%, rgba(24,38,26,.62) 26%, rgba(24,38,26,.18) 50%, transparent 68%)",
  right:
    "linear-gradient(260deg, rgba(24,38,26,.88) 0%, rgba(24,38,26,.62) 26%, rgba(24,38,26,.18) 50%, transparent 68%)",
  bottom:
    "linear-gradient(to top, rgba(24,38,26,.92) 0%, rgba(24,38,26,.62) 22%, rgba(24,38,26,.2) 45%, transparent 66%)",
  top: "linear-gradient(to bottom, rgba(24,38,26,.88) 0%, rgba(24,38,26,.55) 24%, rgba(24,38,26,.15) 46%, transparent 64%)",
  radial:
    "radial-gradient(ellipse 72% 62% at 50% 50%, rgba(24,38,26,.8) 0%, rgba(24,38,26,.56) 42%, rgba(24,38,26,.2) 72%, transparent 92%)",
  none: "none",
};

/** Mobile always reads bottom-up, regardless of the desktop safe zone. */
const MOBILE_SCRIM =
  "linear-gradient(to top, rgba(24,38,26,.94) 0%, rgba(24,38,26,.72) 26%, rgba(24,38,26,.28) 50%, transparent 72%)";

export default function FilmExperience() {
  const root = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrimRefs = useRef<(HTMLDivElement | null)[]>([]);
  const markerRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const railFill = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(FILM_IN);
  const stRef = useRef<ScrollTrigger | null>(null);

  const [loaded, setLoaded] = useState(0);
  const [painted, setPainted] = useState(false);
  const [reduced, setReduced] = useState(false);

  const engine = useFilmEngine(canvasRef, {
    onFirstPaint: () => setPainted(true),
    onLoadProgress: (f) => setLoaded(f),
  });

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  /**
   * Art-direction aid: `/?frame=1180` holds the film on one frame with its
   * choreography applied, so a scene's typography can be judged against the
   * exact composition it will sit on. No effect on a normal visit.
   */
  const previewFrame = useRef<number | null>(null);
  if (typeof window !== "undefined" && previewFrame.current === null) {
    const q = new URLSearchParams(window.location.search).get("frame");
    previewFrame.current = q ? Number(q) : NaN;
  }

  // ── scroll → frame, and frame → choreography ───────────────────────
  useEffect(() => {
    if (reduced) {
      // Reduced motion: hold a representative frame, let the text simply be.
      engine.setFrame(1000);
      sceneRefs.current.forEach((el) => {
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
      return;
    }

    const el = root.current;
    if (!el) return;

    const preview = previewFrame.current;
    const isPreview = typeof preview === "number" && Number.isFinite(preview);

    // Paint the first lit frame immediately, so the opening is the film and
    // not the black leader it fades up from.
    frameRef.current = isPreview ? (preview as number) : FILM_IN;
    engine.setFrame(frameRef.current);

    let st: ScrollTrigger | null = null;
    if (!isPreview) {
      st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: SCROLL_LENGTH,
        pin: true,
        pinSpacing: true,
        scrub: 0.55,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          frameRef.current = progressToFrame(self.progress);
          engine.setFrame(frameRef.current);
        },
        onToggle: (self) => {
          // Lets the sticky CTA stay out of the film's way.
          document.documentElement.classList.toggle("film-active", self.isActive);
        },
      });
      stRef.current = st;
    }

    // One loop drives type, scrims, markers and the rail — locked to the
    // same clock as the canvas, so nothing drifts out of sync with the shot.
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const frame = frameRef.current;

      for (let i = 0; i < SCENES.length; i++) {
        const scene = SCENES[i];
        const node = sceneRefs.current[i];
        const scrim = scrimRefs.current[i];
        const env = sceneEnvelope(scene, frame);

        if (scrim) scrim.style.opacity = String(env);
        if (!node) continue;

        if (env <= 0) {
          if (node.style.visibility !== "hidden") {
            node.style.visibility = "hidden";
            node.style.opacity = "0";
          }
          continue;
        }
        node.style.visibility = "visible";
        node.style.opacity = String(env);

        // Typography travels with the camera rather than sitting bolted to
        // the glass while the shot moves behind it.
        const p = sceneProgress(scene, frame);
        const dx = (scene.drift?.x ?? 0) * (p - 0.5) * 2;
        const dy = (scene.drift?.y ?? 0) * (p - 0.5) * 2;
        const rise = (1 - env) * 26;
        node.style.setProperty("--dx", `${dx}px`);
        node.style.setProperty("--dy", `${dy + rise}px`);
      }

      for (let i = 0; i < MARKERS.length; i++) {
        const m = MARKERS[i];
        const node = markerRefs.current[i];
        if (!node) continue;
        const span = m.out - m.in;
        const t = (frame - m.in) / span;
        const env = t <= 0 || t >= 1 ? 0 : Math.min(1, Math.min(t, 1 - t) / 0.2);
        node.style.opacity = String(env);
        node.style.visibility = env <= 0 ? "hidden" : "visible";
        node.style.transform = `translate(-50%,-50%) scale(${0.9 + env * 0.1})`;
      }

      const prog = frameToProgress(frame);
      if (railFill.current) railFill.current.style.transform = `scaleY(${prog})`;
      for (let i = 0; i < CHAPTERS.length; i++) {
        const btn = chapterRefs.current[i];
        if (!btn) continue;
        const next = CHAPTERS[i + 1]?.frame ?? Infinity;
        const active = frame >= CHAPTERS[i].frame && frame < next;
        btn.dataset.active = active ? "true" : "false";
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = String(Math.max(0, 1 - prog * 22));
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      st?.kill();
      document.documentElement.classList.remove("film-active");
    };
  }, [engine, reduced]);

  const jumpTo = (frame: number) => {
    const st = stRef.current;
    if (!st) return;
    const p = frameToProgress(frame);
    window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "smooth" });
  };

  return (
    <div
      ref={root}
      className="relative h-[100svh] w-full overflow-hidden bg-forest-deep"
    >
      {/* ── the film itself: always exactly the viewport, never letterboxed ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: painted ? 1 : 0, transition: "opacity 900ms ease" }}
        aria-hidden="true"
      />

      {/* ── per-scene scrims: only where type actually lands ── */}
      {SCENES.map((scene, i) => (
        <div
          key={`scrim-${scene.id}`}
          ref={(n) => {
            scrimRefs.current[i] = n;
          }}
          aria-hidden="true"
          className="film-scrim pointer-events-none absolute inset-0 z-10 opacity-0"
          style={
            {
              "--scrim-desktop": scrimStyle[scene.scrim],
              "--scrim-mobile": MOBILE_SCRIM,
            } as React.CSSProperties
          }
        />
      ))}

      {/* The page's primary heading. The film's opening frame carries its own
          "Welcome to Terravion Properties" title card, so putting a second
          headline on the glass would be exactly the competing type the design
          forbids — this states the subject for crawlers and screen readers
          without printing it over the reel. */}
      <h1 className="sr-only">
        Terravion Properties — HMDA and DTCP approved villa plots in
        Shankarpally, West Hyderabad
      </h1>

      {/* ── choreographed typography ── */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {SCENES.map((scene, i) => (
          <div
            key={scene.id}
            ref={(n) => {
              sceneRefs.current[i] = n;
            }}
            data-anchor={scene.anchor}
            className="film-scene"
          >
            {scene.kicker && (
              <p className="label mb-4 text-gold-light/90 md:mb-5">{scene.kicker}</p>
            )}
            <h2 className="display whitespace-pre-line text-[clamp(2.1rem,6.4vw,4.6rem)] leading-[0.98] text-ivory drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
              {scene.title}
            </h2>
            {scene.lead && (
              <p className="mt-5 max-w-[46ch] text-[clamp(0.95rem,1.5vw,1.15rem)] leading-relaxed text-on-dark-secondary">
                {scene.lead}
              </p>
            )}
            {scene.facts && (
              <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
                {scene.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="label text-on-dark-muted">{f.label}</dt>
                    <dd className="display mt-1 text-2xl text-ivory md:text-3xl">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {scene.link && (
              <Link
                href={scene.link.href}
                className="film-link pointer-events-auto mt-8 inline-flex items-center gap-3"
              >
                <span className="label">{scene.link.label}</span>
                <span aria-hidden="true" className="film-link-rule" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* ── in-frame markers on open ground ── */}
      <div className="pointer-events-none absolute inset-0 z-20 hidden md:block">
        {MARKERS.map((m, i) => (
          <Link
            key={m.id}
            href={m.href}
            ref={(n) => {
              markerRefs.current[i] = n;
            }}
            className="film-marker pointer-events-auto absolute opacity-0"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          >
            <span className="film-marker-dot" aria-hidden="true" />
            <span className="film-marker-body">
              <span className="block text-sm font-medium text-ivory">{m.label}</span>
              <span className="label mt-1 block text-on-dark-muted">{m.meta}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* ── chapter rail ── */}
      <nav
        aria-label="Film chapters"
        className="absolute right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-4 lg:flex"
      >
        <div className="relative mb-2 h-24 w-px bg-ivory/20">
          <div
            ref={railFill}
            className="absolute inset-x-0 top-0 h-full origin-top bg-gold"
            style={{ transform: "scaleY(0)" }}
          />
        </div>
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            ref={(n) => {
              chapterRefs.current[i] = n;
            }}
            onClick={() => jumpTo(c.frame)}
            className="film-chapter group flex items-center gap-3"
          >
            <span className="film-chapter-label">{c.label}</span>
            <span className="film-chapter-tick" aria-hidden="true" />
          </button>
        ))}
      </nav>

      {/* ── scroll invitation ──
          Lower-left, not centre: the opening frame has the presenter standing
          dead centre, and the brief is explicit that type never lands on a
          person. It carries its own soft gradient for contrast. */}
      <div
        ref={hintRef}
        className="pointer-events-none absolute bottom-8 left-[7vw] z-30 flex items-center gap-4 text-on-dark-secondary md:left-[6vw]"
      >
        <span className="film-hint-line" aria-hidden="true" />
        <span className="label drop-shadow-[0_1px_10px_rgba(0,0,0,0.7)]">
          Scroll to begin the film
        </span>
      </div>

      {/* ── loader: full-bleed, never a white void ── */}
      <div
        className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center bg-forest-deep transition-opacity duration-1000"
        style={{
          opacity: painted && loaded > 0.012 ? 0 : 1,
          visibility: painted && loaded > 0.012 ? "hidden" : "visible",
        }}
      >
        <p className="display text-3xl text-ivory md:text-4xl">Terravion</p>
        <p className="label mt-3 text-gold-light">Shankarpally</p>
        <div className="mt-8 h-px w-40 overflow-hidden bg-ivory/15">
          <div
            className="h-full bg-gold transition-[width] duration-300"
            style={{ width: `${Math.min(100, loaded * 900)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
