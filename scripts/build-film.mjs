/**
 * Regenerates the scroll-scrubbed frame ladders from the master reel.
 *
 *   node scripts/build-film.mjs [path-to-mp4]
 *
 * Two tiers are produced. Both are decimated — at scrub speed the eye cannot
 * resolve every 24th of a second, and halving the frames halves the bytes:
 *
 *   hd  1600×900, every 2nd source frame (1080 files, ~73 MB) — desktop
 *   sd   960×540, every 4th source frame  (540 files, ~19 MB) — phones,
 *                                                               save-data, 2G
 *
 * File numbering is sequential per tier; lib/film.ts maps original frame
 * numbers onto these indices via FILM_TIERS.step, so the choreography stays
 * authored against the real timecode of the reel.
 *
 * Requires ffmpeg on PATH.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2] ?? join(root, "frames", "Terra_4K.mp4");

if (!existsSync(src)) {
  console.error(`Master reel not found: ${src}`);
  console.error("Pass the path explicitly: node scripts/build-film.mjs <file.mp4>");
  process.exit(1);
}

const tiers = [
  { name: "hd", step: 2, scale: "1600:900", quality: 70 },
  { name: "sd", step: 4, scale: "960:540", quality: 66 },
];

for (const t of tiers) {
  const out = join(root, "public", "film", t.name);
  mkdirSync(out, { recursive: true });
  console.log(`encoding ${t.name} (every ${t.step}th frame @ ${t.scale})…`);
  execFileSync(
    "ffmpeg",
    [
      "-y", "-v", "error",
      "-i", src,
      "-vf", `select='not(mod(n\\,${t.step}))',scale=${t.scale}:flags=lanczos`,
      "-vsync", "0",
      "-c:v", "libwebp",
      "-quality", String(t.quality),
      "-compression_level", "6",
      "-preset", "picture",
      join(out, "f%04d.webp"),
    ],
    { stdio: "inherit" }
  );
  console.log(`  → ${out}`);
}

console.log("done. Frame counts must match FILM_TIERS in lib/film.ts.");
