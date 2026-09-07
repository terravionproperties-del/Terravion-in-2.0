/**
 * Film asset pipeline: 4K PNG masters → five WebP delivery tiers.
 *
 *   npm run film:build              incremental; skips frames already current
 *   npm run film:build -- --force   re-encode everything
 *   npm run film:build -- --tier hd encode one tier
 *   npm run film:verify             checksums, continuity, manifest integrity
 *   npm run film:manifest           rebuild the manifest from what is on disk
 *   npm run film:clean              remove generated tiers (never the masters)
 *
 * The masters are ~8 GB and never enter `public/`. Nothing here copies, links
 * or serves a PNG; the browser only ever sees the WebP tiers.
 *
 * Incrementality is by content, not timestamp. A frame is re-encoded when the
 * master's hash changes or the output is missing — so a restored backup with
 * fresh mtimes does not trigger a multi-hour rebuild, and an interrupted run
 * resumes exactly where it stopped.
 *
 * Work is spread across worker threads. Each worker owns a contiguous slice,
 * spawns ffmpeg per frame, and hashes its own output — hashing is CPU-bound and
 * genuinely benefits from being off the main thread, which is why workers are
 * used rather than a bare pool of child processes.
 */
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { cpus } from "node:os";
import { basename, join, resolve } from "node:path";

// ── configuration ────────────────────────────────────────────────────────

interface Tier {
  name: string;
  width: number;
  quality: number;
}

const TIERS: Tier[] = [
  { name: "ultra", width: 2560, quality: 92 },
  { name: "hd", width: 1600, quality: 88 },
  { name: "tablet", width: 1280, quality: 84 },
  { name: "mobile", width: 960, quality: 80 },
  { name: "low", width: 640, quality: 76 },
];

const FPS = 24;
const ROOT = resolve(process.cwd());
const OUT_ROOT = join(ROOT, "public", "film");
const MANIFEST_DIR = join(OUT_ROOT, "manifest");
const STATE_FILE = join(MANIFEST_DIR, ".build-state.json");

/** Masters live outside public/. Both layouts are accepted. */
const MASTER_CANDIDATES = [join(ROOT, "film", "master"), join(ROOT, "frames", "Terra_4K")];

function findMasterDir(): string {
  for (const dir of MASTER_CANDIDATES) {
    if (existsSync(dir) && readdirSync(dir).some((f) => f.toLowerCase().endsWith(".png"))) {
      return dir;
    }
  }
  throw new Error(
    `No PNG masters found. Looked in:\n  ${MASTER_CANDIDATES.join("\n  ")}\n` +
      `Masters must stay outside public/.`
  );
}

const tierHeight = (w: number) => Math.round(w * (2160 / 3840));

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function outputName(index: number): string {
  return `f${String(index).padStart(4, "0")}.webp`;
}

interface FrameResult {
  name: string;
  index: number;
  masterHash: string;
  checksum: string;
  bytes: number;
  status: "encoded" | "skipped" | "failed";
  error?: string;
}

interface Job {
  tier: Tier;
  masters: { path: string; index: number; hash: string }[];
  outDir: string;
  force: boolean;
  previous: Record<string, string>;
}

// ── worker ───────────────────────────────────────────────────────────────

function encodeOne(src: string, dest: string, width: number, quality: number): Promise<void> {
  return new Promise((ok, fail) => {
    const args = [
      "-y",
      "-loglevel", "error",
      "-i", src,
      "-vf", `scale=${width}:-2:flags=lanczos,unsharp=3:3:0.4:3:3:0.0`,
      "-c:v", "libwebp",
      "-quality", String(quality),
      "-compression_level", "6",
      "-preset", "picture",
      "-an",
      dest,
    ];
    const p = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => fail(new Error(`ffmpeg not runnable: ${e.message}`)));
    p.on("close", (code) => (code === 0 ? ok() : fail(new Error(err.trim() || `exit ${code}`))));
  });
}

async function runWorker(job: Job) {
  const results: FrameResult[] = [];

  for (const m of job.masters) {
    const name = outputName(m.index);
    const dest = join(job.outDir, name);
    const unchanged = job.previous[name] === m.hash && existsSync(dest);

    if (!job.force && unchanged) {
      const buf = readFileSync(dest);
      results.push({
        name, index: m.index, masterHash: m.hash,
        checksum: sha256(buf), bytes: buf.length, status: "skipped",
      });
      parentPort?.postMessage({ type: "progress" });
      continue;
    }

    let lastError = "";
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      try {
        await encodeOne(m.path, dest, job.tier.width, job.tier.quality);
        const buf = readFileSync(dest);
        results.push({
          name, index: m.index, masterHash: m.hash,
          checksum: sha256(buf), bytes: buf.length, status: "encoded",
        });
        done = true;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        // Transient ffmpeg failures (file locks, I/O contention) are common at
        // this volume; a short backoff clears most of them.
        if (attempt < 3) await new Promise((r) => setTimeout(r, 250 * attempt));
      }
    }

    if (!done) {
      results.push({
        name, index: m.index, masterHash: m.hash,
        checksum: "", bytes: 0, status: "failed", error: lastError,
      });
    }
    parentPort?.postMessage({ type: "progress" });
  }

  parentPort?.postMessage({ type: "done", results });
}

if (!isMainThread) {
  runWorker(workerData as Job).catch((e) => {
    parentPort?.postMessage({ type: "fatal", error: String(e) });
  });
}

// ── main ─────────────────────────────────────────────────────────────────

interface TierManifest {
  tier: string;
  width: number;
  height: number;
  quality: number;
  frameCount: number;
  checksum: string;
  estimatedDownloadBytes: number;
  estimatedDecodedBytes: number;
  frames: string[];
}

function listMasters(dir: string) {
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort()
    .map((f, i) => ({ path: join(dir, f), index: i + 1, name: basename(f), hash: "" }));
}

function hashMasters(masters: ReturnType<typeof listMasters>) {
  // Hash the header plus the byte size rather than 8 GB of pixel data: enough
  // to detect a re-export, cheap enough to run on every build.
  for (const m of masters) {
    const st = statSync(m.path);
    const head = readFileSync(m.path).subarray(0, 65536);
    m.hash = createHash("sha256").update(head).update(String(st.size)).digest("hex").slice(0, 32);
  }
}

function bar(done: number, total: number, label: string) {
  const pct = total ? done / total : 0;
  const width = 28;
  const filled = Math.round(pct * width);
  process.stdout.write(
    `\r  ${label.padEnd(7)} [${"█".repeat(filled)}${"·".repeat(width - filled)}] ` +
      `${String(Math.round(pct * 100)).padStart(3)}%  ${done}/${total}   `
  );
}

async function buildTier(
  tier: Tier,
  masters: ReturnType<typeof listMasters>,
  force: boolean,
  state: Record<string, Record<string, string>>
): Promise<FrameResult[]> {
  const outDir = join(OUT_ROOT, tier.name);
  mkdirSync(outDir, { recursive: true });

  const previous = state[tier.name] ?? {};
  const workerCount = Math.max(1, Math.min(cpus().length - 1, 8));
  const chunk = Math.ceil(masters.length / workerCount);

  let done = 0;
  const all: FrameResult[] = [];

  await Promise.all(
    Array.from({ length: workerCount }, (_, w) => {
      const slice = masters.slice(w * chunk, (w + 1) * chunk);
      if (!slice.length) return Promise.resolve();

      return new Promise<void>((ok, fail) => {
        const worker = new Worker(new URL(import.meta.url), {
          workerData: {
            tier,
            masters: slice.map((m) => ({ path: m.path, index: m.index, hash: m.hash })),
            outDir,
            force,
            previous,
          } satisfies Job,
        });
        worker.on("message", (msg) => {
          if (msg.type === "progress") bar(++done, masters.length, tier.name);
          else if (msg.type === "done") all.push(...msg.results);
          else if (msg.type === "fatal") fail(new Error(msg.error));
        });
        worker.on("error", fail);
        worker.on("exit", () => ok());
      });
    })
  );

  process.stdout.write("\n");
  all.sort((a, b) => a.index - b.index);

  // Persist after every tier so an interrupted run resumes cleanly.
  state[tier.name] = Object.fromEntries(
    all.filter((r) => r.status !== "failed").map((r) => [r.name, r.masterHash])
  );
  mkdirSync(MANIFEST_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state), "utf8");

  return all;
}

function buildManifest(results: Record<string, FrameResult[]>): TierManifest[] {
  return TIERS.filter((t) => results[t.name]?.length).map((t) => {
    const frames = results[t.name].filter((r) => r.status !== "failed");
    const height = tierHeight(t.width);
    return {
      tier: t.name,
      width: t.width,
      height,
      quality: t.quality,
      frameCount: frames.length,
      // One checksum over the ordered per-frame checksums: changes if any frame
      // changes, and cheap for a client to compare against.
      checksum: createHash("sha256").update(frames.map((f) => f.checksum).join("")).digest("hex"),
      estimatedDownloadBytes: frames.reduce((n, f) => n + f.bytes, 0),
      estimatedDecodedBytes: frames.length * t.width * height * 4,
      frames: frames.map((f) => f.name),
    };
  });
}

function writeArtifacts(
  tiers: TierManifest[],
  results: Record<string, FrameResult[]>,
  ms: number
) {
  mkdirSync(MANIFEST_DIR, { recursive: true });

  writeFileSync(
    join(MANIFEST_DIR, "film-manifest.json"),
    JSON.stringify(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        fps: FPS,
        frameCount: tiers[0]?.frameCount ?? 0,
        tiers,
      },
      null,
      2
    ),
    "utf8"
  );

  writeFileSync(
    join(MANIFEST_DIR, "checksums.json"),
    JSON.stringify(
      Object.fromEntries(
        Object.entries(results).map(([tier, frames]) => [
          tier,
          Object.fromEntries(frames.filter((f) => f.checksum).map((f) => [f.name, f.checksum])),
        ])
      ),
      null,
      2
    ),
    "utf8"
  );

  const flat = Object.values(results).flat();
  const outBytes = flat.reduce((n, f) => n + f.bytes, 0);
  let masterBytes = 0;
  try {
    const dir = findMasterDir();
    masterBytes = readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".png"))
      .reduce((n, f) => n + statSync(join(dir, f)).size, 0);
  } catch {
    masterBytes = 0;
  }

  const failures: { tier: string; frame: string; error?: string }[] = [];
  for (const [tier, frames] of Object.entries(results)) {
    for (const f of frames) {
      if (f.status === "failed") failures.push({ tier, frame: f.name, error: f.error });
    }
  }

  writeFileSync(
    join(MANIFEST_DIR, "encoding-report.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalFrames: flat.length,
        encodedFrames: flat.filter((f) => f.status === "encoded").length,
        skippedFrames: flat.filter((f) => f.status === "skipped").length,
        failedFrames: failures,
        masterBytes,
        outputBytes: outBytes,
        compressionRatio: masterBytes && outBytes ? +(masterBytes / outBytes).toFixed(2) : null,
        encodeDurationMs: ms,
      },
      null,
      2
    ),
    "utf8"
  );
}

function verify(): number {
  const manifestPath = join(MANIFEST_DIR, "film-manifest.json");
  const checksumPath = join(MANIFEST_DIR, "checksums.json");
  if (!existsSync(manifestPath) || !existsSync(checksumPath)) {
    console.error("  FAIL  manifest or checksums missing — run npm run film:build");
    return 60;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const checksums = JSON.parse(readFileSync(checksumPath, "utf8"));
  let failures = 0;

  for (const t of manifest.tiers as TierManifest[]) {
    const dir = join(OUT_ROOT, t.tier);
    let missing = 0;
    let mismatched = 0;

    for (const name of t.frames) {
      const p = join(dir, name);
      if (!existsSync(p)) {
        missing++;
        continue;
      }
      if (sha256(readFileSync(p)) !== checksums[t.tier]?.[name]) mismatched++;
    }

    // Numbering continuity: f0001 … fNNNN with no gaps.
    const indices = t.frames.map((n) => Number(n.replace(/\D/g, ""))).sort((a, b) => a - b);
    const gaps = indices.filter((v, i) => i > 0 && v !== indices[i - 1] + 1).length;

    const recomputed = createHash("sha256")
      .update(t.frames.map((n) => checksums[t.tier]?.[n] ?? "").join(""))
      .digest("hex");
    const manifestOk = recomputed === t.checksum;

    const bad = missing || mismatched || gaps || !manifestOk;
    if (bad) failures++;
    console.log(
      `  ${bad ? "FAIL" : " ok "}  ${t.tier.padEnd(7)} ${t.frameCount} frames · ` +
        `missing ${missing} · mismatched ${mismatched} · gaps ${gaps} · ` +
        `manifest ${manifestOk ? "ok" : "MISMATCH"}`
    );
  }

  return failures ? 60 : 0;
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0] ?? "build";

  if (cmd === "clean") {
    for (const t of TIERS) rmSync(join(OUT_ROOT, t.name), { recursive: true, force: true });
    rmSync(MANIFEST_DIR, { recursive: true, force: true });
    console.log("  removed generated tiers and manifest (masters untouched)");
    return;
  }

  if (cmd === "verify") {
    process.exitCode = verify();
    return;
  }

  const masterDir = findMasterDir();
  const masters = listMasters(masterDir);
  if (!masters.length) throw new Error(`No PNG frames in ${masterDir}`);

  const only = argv.includes("--tier") ? argv[argv.indexOf("--tier") + 1] : null;
  const force = argv.includes("--force");
  const tiers = only ? TIERS.filter((t) => t.name === only) : TIERS;
  if (!tiers.length) throw new Error(`Unknown tier: ${only}`);

  const state: Record<string, Record<string, string>> = existsSync(STATE_FILE)
    ? JSON.parse(readFileSync(STATE_FILE, "utf8"))
    : {};

  if (cmd === "manifest") {
    // Rebuild the manifest from what is already on disk, without encoding.
    const results: Record<string, FrameResult[]> = {};
    for (const t of tiers) {
      const dir = join(OUT_ROOT, t.name);
      if (!existsSync(dir)) continue;
      results[t.name] = readdirSync(dir)
        .filter((f) => f.endsWith(".webp"))
        .sort()
        .map((name) => {
          const buf = readFileSync(join(dir, name));
          return {
            name,
            index: Number(name.replace(/\D/g, "")),
            masterHash: "",
            checksum: sha256(buf),
            bytes: buf.length,
            status: "skipped" as const,
          };
        });
    }
    writeArtifacts(buildManifest(results), results, 0);
    console.log("  manifest rebuilt from disk");
    return;
  }

  console.log(`  masters: ${masters.length} frames in ${masterDir}`);
  hashMasters(masters);

  const started = Date.now();
  const results: Record<string, FrameResult[]> = {};
  for (const t of tiers) {
    results[t.name] = await buildTier(t, masters, force, state);
  }
  const ms = Date.now() - started;

  writeArtifacts(buildManifest(results), results, ms);

  const flat = Object.values(results).flat();
  const failed = flat.filter((f) => f.status === "failed").length;
  const outBytes = flat.reduce((n, f) => n + f.bytes, 0);
  console.log(
    `\n  encoded ${flat.filter((f) => f.status === "encoded").length} · ` +
      `skipped ${flat.filter((f) => f.status === "skipped").length} · failed ${failed}`
  );
  console.log(`  output ${(outBytes / 1024 / 1024).toFixed(1)} MB in ${(ms / 1000).toFixed(1)}s`);
  console.log(`  manifest → public/film/manifest/`);
  if (failed) process.exitCode = 60;
}

if (isMainThread) {
  main().catch((e) => {
    console.error(`\n  ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 60;
  });
}
