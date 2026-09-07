/**
 * Manifest layer for the five-tier film pipeline.
 *
 * Deliberately a separate module from `lib/film.ts`. That file holds the
 * cinematic choreography — SCENES, BAKED ranges, focusAt, sceneEnvelope — which
 * was authored by pulling scene midpoints through ffmpeg and inspecting frames
 * one at a time to find where the reel carries its own typography. Keeping the
 * manifest code out of that file makes it structurally impossible for this
 * change to disturb it.
 *
 * Everything degrades. If the manifest is missing, slow, or malformed the
 * caller falls back to the legacy hd/sd paths and the homepage renders exactly
 * as it does today. A cinematic experience that goes blank because a JSON file
 * 404'd is a worse outcome than one that ships at the old tier.
 */

export const TIER_ORDER = ["ultra", "hd", "tablet", "mobile", "low"] as const;
export type ManifestTier = (typeof TIER_ORDER)[number];

export interface ManifestTierEntry {
  tier: ManifestTier;
  width: number;
  height: number;
  quality: number;
  frameCount: number;
  checksum: string;
  estimatedDownloadBytes: number;
  estimatedDecodedBytes: number;
  frames: string[];
}

export interface FilmManifest {
  version: number;
  generatedAt: string;
  fps: number;
  frameCount: number;
  tiers: ManifestTierEntry[];
}

const MANIFEST_URL = "/film/manifest/film-manifest.json";

/** Bootstrap must not hang on a slow or absent manifest. */
const FETCH_TIMEOUT_MS = 1500;

const isDev = process.env.NODE_ENV !== "production";
const warn = (msg: string) => {
  if (isDev) console.warn(`[film-manifest] ${msg}`);
};

// ── single-flight fetch ──────────────────────────────────────────────────

let inFlight: Promise<FilmManifest | null> | null = null;
let cached: FilmManifest | null = null;
let cachedVersion: number | null = null;

function looksValid(m: unknown): m is FilmManifest {
  if (!m || typeof m !== "object") return false;
  const c = m as Partial<FilmManifest>;
  return (
    typeof c.version === "number" &&
    Array.isArray(c.tiers) &&
    c.tiers.length > 0 &&
    c.tiers.every((t) => Array.isArray(t.frames) && t.frames.length > 0)
  );
}

/**
 * Fetch the manifest at most once per session.
 *
 * Concurrent callers share one promise rather than racing separate requests. A
 * version change clears the memo, so a redeployed film is picked up on the next
 * navigation without a hard reload.
 *
 * Returns null — never throws — when the manifest cannot be read. Null is the
 * caller's signal to use the legacy loader.
 */
export async function getFilmManifest(): Promise<FilmManifest | null> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch(MANIFEST_URL, {
        cache: "force-cache",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) {
        warn(`manifest HTTP ${res.status} — using legacy tiers`);
        return null;
      }

      const json: unknown = await res.json();
      if (!looksValid(json)) {
        warn("manifest malformed — using legacy tiers");
        return null;
      }

      if (cachedVersion !== null && json.version !== cachedVersion) {
        warn(`manifest version ${cachedVersion} → ${json.version}, cache invalidated`);
      }
      cached = json;
      cachedVersion = json.version;
      return json;
    } catch {
      // Timeout, offline, or a parse failure. Serve whatever is already held;
      // otherwise the caller falls back to legacy paths.
      warn("manifest unavailable — using legacy tiers");
      return cached;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Synchronous peek. Null until `getFilmManifest()` has resolved once. */
export function peekFilmManifest(): FilmManifest | null {
  return cached;
}

// ── tier selection ───────────────────────────────────────────────────────

/**
 * Choose a tier, cheapest constraint first.
 *
 * Data saving and a 2G connection are explicit statements about what the
 * visitor wants; they outrank a wide screen. Memory outranks pixel density,
 * because a retina tablet with 2 GB thrashes on the ultra ladder long before it
 * looks any better.
 */
export function getTier(): ManifestTier {
  if (typeof window === "undefined") return "hd";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  if (nav.connection?.saveData) return "low";
  if (/(^|-)2g$/.test(nav.connection?.effectiveType ?? "")) return "low";

  const memory = nav.deviceMemory ?? 4;
  if (memory <= 2) return "low";

  const width = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;

  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  if (memory <= 4) return "hd";
  return dpr > 1.5 && width >= 1440 ? "ultra" : "hd";
}

/**
 * The next tier down, or null at the bottom.
 *
 * Downgrade only. A tier that failed once will fail again on the same
 * connection, and oscillating mid-scroll would evict a warm cache for nothing.
 */
export function nextTierDown(tier: ManifestTier): ManifestTier | null {
  const i = TIER_ORDER.indexOf(tier);
  return i >= 0 && i < TIER_ORDER.length - 1 ? TIER_ORDER[i + 1] : null;
}

export function tierEntry(
  manifest: FilmManifest,
  tier: ManifestTier
): ManifestTierEntry | null {
  return manifest.tiers.find((t) => t.tier === tier) ?? null;
}

/**
 * Resolve a tier that actually exists in the manifest.
 *
 * A partial build — one tier encoded, the rest pending — is a normal state
 * during a long encode, and the site should serve whatever is ready rather than
 * fail on a preference.
 */
export function resolveAvailableTier(
  manifest: FilmManifest,
  preferred: ManifestTier
): ManifestTier | null {
  let tier: ManifestTier | null = preferred;
  while (tier) {
    if (tierEntry(manifest, tier)) return tier;
    tier = nextTierDown(tier);
  }
  // Nothing at or below the preference; take the first the manifest offers.
  return manifest.tiers[0]?.tier ?? null;
}

// ── frame URLs ───────────────────────────────────────────────────────────

/**
 * Build a frame URL from manifest data. `index` is 1-based, matching the
 * loader's playhead and the encoder's output numbering.
 *
 * Never concatenates a guessed filename: the name comes from `frames[]`, so a
 * change to the encoder's naming needs no change here.
 */
export function getFrameURL(
  manifest: FilmManifest,
  tier: ManifestTier,
  index: number
): string | null {
  const entry = tierEntry(manifest, tier);
  if (!entry) return null;
  const name = entry.frames[index - 1];
  return name ? `/film/${tier}/${name}` : null;
}

export function frameCountFor(manifest: FilmManifest, tier: ManifestTier): number {
  return tierEntry(manifest, tier)?.frameCount ?? 0;
}

/** Decoded bytes for the whole tier, straight from the encoder's measurement. */
export function estimateMemory(manifest: FilmManifest, tier: ManifestTier): number {
  return tierEntry(manifest, tier)?.estimatedDecodedBytes ?? 0;
}

/** Decoded bytes for one frame — what the LRU actually budgets against. */
export function frameBytes(manifest: FilmManifest, tier: ManifestTier): number {
  const entry = tierEntry(manifest, tier);
  if (!entry) return 0;
  return entry.frameCount > 0
    ? Math.round(entry.estimatedDecodedBytes / entry.frameCount)
    : entry.width * entry.height * 4;
}
