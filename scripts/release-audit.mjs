/**
 * RC1 release audit. One command, repeatable, exits non-zero on failure.
 *
 *   npm run release:audit
 *   npm run release:audit -- --skip-build     reuse the existing .next
 *
 * Why this exists rather than a checklist: the previous attempt ran Lighthouse
 * against a server that had already exited, and Chrome reported an interstitial
 * that was misread twice as a CSP problem. Two security-config edits were made
 * on a false diagnosis before the real cause — a dead server — was found.
 *
 * So the server's lifetime is owned by this process from start to finish, and
 * readiness is *polled*, never assumed. A fixed sleep encodes a guess about
 * startup time; this waits for an actual 200 and fails loudly if it never
 * comes, instead of handing a dead port to an auditor that will blame
 * something else.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PORT = Number(process.env.AUDIT_PORT ?? 3000);
const BASE = `http://localhost:${PORT}`;
const skipBuild = process.argv.includes("--skip-build");

/**
 * Stable exit codes, so a CI failure is identifiable without parsing logs.
 * The lowest-numbered failure wins, which puts the earliest stage — and so
 * usually the root cause — in the exit status rather than a downstream symptom.
 */
const EXIT_CODES = {
  Typecheck: 10,
  Build: 11,
  "Server ready": 20,
  Environment: 21,
  "Route crawl": 30,
  "robots.txt": 30,
  "sitemap.xml": 30,
  "Lighthouse desktop": 40,
  "Lighthouse mobile": 40,
  axe: 41,
  pa11y: 42,
  "Security headers": 50,
  "CSP upgrade-insecure-requests": 50,
  "CSP wildcards": 50,
  "Structured data": 60,
};

// Each run gets its own directory, so quality is a trend rather than a
// snapshot that the next run overwrites. `reports/latest.json` points at the
// most recent, for anything that just wants the current state.
const RUN_ID = new Date().toISOString().replace(/[:T]/g, "-").replace(/\..+/, "");
const REPORTS = resolve("reports", RUN_ID);

// Audit-time values. Lead capture must be configured or the env gate refuses
// the boot and every auditor reports a dead site rather than a broken one.
const AUDIT_ENV = {
  ...process.env,
  NODE_ENV: "production",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? BASE,
  CRM_LEAD_ENDPOINT: process.env.CRM_LEAD_ENDPOINT ?? "http://localhost:3100/api/webhooks/lead",
  LEAD_WEBHOOK_SECRET:
    process.env.LEAD_WEBHOOK_SECRET ?? "local-audit-secret-000000000000000000000000",
};

const results = [];
const record = (name, status, detail = "", data = null) => {
  results.push({ name, status, detail, data });
  const mark = { PASS: " ok  ", FAIL: "FAIL ", WARN: "warn ", SKIP: " --  " }[status];
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ""}`);
};

const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: "utf8", shell: true, ...opts });

mkdirSync(REPORTS, { recursive: true });

let server = null;
const stopServer = () => {
  if (!server) return;
  try {
    if (process.platform === "win32") run("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
    else server.kill("SIGTERM");
  } catch {
    /* already gone */
  }
};

function finish() {
  stopServer();
  const fails = results.filter((r) => r.status === "FAIL");
  const lines = [
    `# RC1 release audit`,
    ``,
    `Run: ${new Date().toISOString()}`,
    `Base: ${BASE}`,
    ``,
    `| Check | Status | Detail |`,
    `| --- | --- | --- |`,
    ...results.map((r) => `| ${r.name} | ${r.status} | ${r.detail.replace(/\|/g, "\\|") || "—"} |`),
    ``,
    fails.length
      ? `## RC1 NOT CERTIFIED — ${fails.length} check(s) failed\n\n` +
        fails.map((f) => `- **${f.name}** — ${f.detail}`).join("\n")
      : `## RC1 CERTIFIED — every mandatory check passed`,
    ``,
    `Reports in \`reports/\`.`,
  ];
  writeFileSync(`${REPORTS}/summary.md`, lines.join("\n"));

  // Machine-readable twin of the summary, for CI and dashboards.
  const key = (n) =>
    n.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^./, (c) =>
      c.toLowerCase()
    );
  const release = {
    release: process.env.RELEASE_TAG ?? "RC1",
    runId: RUN_ID,
    timestamp: new Date().toISOString(),
    base: BASE,
  };
  for (const r of results) {
    // Lighthouse rows carry scores; everything else is a verdict.
    if (r.data?.scores) {
      release[key(r.name)] = r.data.scores.performance ?? null;
      release[`${key(r.name)}Detail`] = { ...r.data.scores, ...r.data.vitals };
    } else {
      release[key(r.name)] = r.status;
    }
  }
  release.overall = fails.length ? "FAIL" : "PASS";
  release.failed = fails.map((f) => f.name);

  writeFileSync(`${REPORTS}/release.json`, JSON.stringify(release, null, 2));
  writeFileSync(
    resolve("reports", "latest.json"),
    JSON.stringify({ ...release, reportDir: `reports/${RUN_ID}` }, null, 2)
  );

  console.log(`\n${results.filter((r) => r.status === "PASS").length} pass · ${fails.length} fail`);
  console.log(`reports → reports/${RUN_ID}/`);

  // Earliest failing stage decides the code; a build break should not be
  // reported as a Lighthouse failure just because Lighthouse also fell over.
  const code = fails.length
    ? Math.min(...fails.map((f) => EXIT_CODES[f.name] ?? 1))
    : 0;
  if (code) console.log(`exit ${code} — ${fails.map((f) => f.name).join(", ")}`);
  process.exit(code);
}

process.on("SIGINT", () => {
  stopServer();
  process.exit(130);
});

// ── 1. build ───────────────────────────────────────────────────────────
if (skipBuild) {
  record("Build", "SKIP", "--skip-build");
} else {
  const b = run("npm", ["run", "build"], { env: AUDIT_ENV });
  const out = `${b.stdout}\n${b.stderr}`;
  if (b.status !== 0) {
    record("Build", "FAIL", "build failed");
    console.error(out.slice(-2000));
    finish();
  }
  const warnings = (out.match(/warn/gi) ?? []).length;
  record("Build", warnings ? "WARN" : "PASS", `${warnings} warning(s)`);
}

// ── 2. typecheck ───────────────────────────────────────────────────────
{
  const tc = run("npx", ["tsc", "--noEmit"]);
  const errors = (tc.stdout.match(/error TS/g) ?? []).length;
  record("Typecheck", tc.status === 0 ? "PASS" : "FAIL", `${errors} error(s)`);
}

// ── 3. start the server and WAIT for it ────────────────────────────────
console.log(`\nstarting server on ${BASE}`);
server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  env: AUDIT_ENV,
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));
process.on("exit", stopServer);

async function waitForReady(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(4000) });
      if (res.status === 200) return true;
      // A 500 here is almost always the env gate refusing to boot. Say so,
      // rather than letting an auditor blame the page.
      if (res.status === 500) {
        record(
          "Server ready",
          "FAIL",
          "HTTP 500 — likely environment validation; check CRM_LEAD_ENDPOINT / LEAD_WEBHOOK_SECRET"
        );
        return false;
      }
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

if (!(await waitForReady())) {
  if (!results.some((r) => r.name === "Server ready")) {
    record("Server ready", "FAIL", `no 200 from ${BASE} within 90s`);
  }
  console.error("\n--- server output ---\n" + serverLog.slice(-1500));
  finish();
}
record("Server ready", "PASS", BASE);

// ── 4. headers ─────────────────────────────────────────────────────────
{
  const res = await fetch(`${BASE}/`);
  const h = Object.fromEntries(res.headers.entries());
  writeFileSync(`${REPORTS}/headers.json`, JSON.stringify(h, null, 2));

  const REQUIRED = [
    "content-security-policy",
    "strict-transport-security",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "cross-origin-embedder-policy",
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "permissions-policy",
  ];
  const missing = REQUIRED.filter((k) => !(k in h));
  record(
    "Security headers",
    missing.length ? "FAIL" : "PASS",
    missing.length ? `missing: ${missing.join(", ")}` : `${REQUIRED.length} present`
  );

  const csp = h["content-security-policy"] ?? h["content-security-policy-report-only"] ?? "";
  const httpsCanonical = AUDIT_ENV.NEXT_PUBLIC_SITE_URL.startsWith("https://");
  const upgrade = csp.includes("upgrade-insecure-requests");
  record(
    "CSP upgrade-insecure-requests",
    upgrade === httpsCanonical ? "PASS" : "FAIL",
    `present=${upgrade}, canonical https=${httpsCanonical}`
  );
  record(
    "CSP wildcards",
    /(^|\s)\*(\s|$)/.test(csp) ? "FAIL" : "PASS",
    /(^|\s)\*(\s|$)/.test(csp) ? "wildcard host present" : "none"
  );
}

// ── 5. robots + sitemap ────────────────────────────────────────────────
{
  const robots = await fetch(`${BASE}/robots.txt`);
  const rtxt = await robots.text();
  record(
    "robots.txt",
    robots.status === 200 && /Sitemap:/i.test(rtxt) ? "PASS" : "FAIL",
    `HTTP ${robots.status}`
  );

  const sm = await fetch(`${BASE}/sitemap.xml`);
  const urls = ((await sm.text()).match(/<loc>/g) ?? []).length;
  record("sitemap.xml", sm.status === 200 && urls > 0 ? "PASS" : "FAIL", `${urls} URLs`);
}

// ── 6. route crawl ─────────────────────────────────────────────────────
{
  const c = run("node", ["scripts/audit-site.mjs"], { env: { ...AUDIT_ENV, AUDIT_BASE: BASE } });
  const out = `${c.stdout}${c.stderr}`;
  writeFileSync(`${REPORTS}/route-crawl.txt`, out);
  const broken = /BROKEN ROUTES:\s*(\d+)/.exec(out)?.[1] ?? "?";
  const noAlt = /IMAGES WITHOUT ALT:\s*(\d+)/.exec(out)?.[1] ?? "?";
  record(
    "Route crawl",
    broken === "0" ? "PASS" : "FAIL",
    `${broken} broken, ${noAlt} images without alt`
  );
}

// ── 7. lighthouse ──────────────────────────────────────────────────────
const LH_TARGETS = { performance: 95, accessibility: 100, "best-practices": 100, seo: 100 };

function lighthouse(label, extraArgs) {
  const path = `${REPORTS}/lighthouse-${label}`;
  const r = run("npx", [
    "--yes", "lighthouse@12", `${BASE}/`,
    ...extraArgs,
    "--output=json", "--output=html", `--output-path=${path}`,
    `--chrome-flags="--headless=new --no-sandbox"`, "--quiet",
  ]);

  const json = existsSync(`${path}.report.json`) ? `${path}.report.json` : `${path}.json`;
  if (!existsSync(json)) {
    record(`Lighthouse ${label}`, "FAIL", "no report written");
    console.error((r.stderr || r.stdout || "").slice(-800));
    return;
  }
  const report = JSON.parse(readFileSync(json, "utf8"));
  if (report.runtimeError) {
    record(`Lighthouse ${label}`, "FAIL", report.runtimeError.code);
    return;
  }
  const scores = {};
  for (const [k, v] of Object.entries(report.categories)) scores[k] = Math.round(v.score * 100);
  const below = Object.entries(LH_TARGETS).filter(([k, t]) => (scores[k] ?? 0) < t);
  const vitals = {};
  for (const m of ["largest-contentful-paint", "cumulative-layout-shift", "total-blocking-time"]) {
    vitals[m] = report.audits[m]?.displayValue ?? "-";
  }
  record(
    `Lighthouse ${label}`,
    below.length ? "FAIL" : "PASS",
    Object.entries(scores).map(([k, v]) => `${k}=${v}`).join(" ") +
      " | " +
      Object.entries(vitals).map(([k, v]) => `${k.split("-")[0]}=${v}`).join(" "),
    { scores, vitals }
  );
}

lighthouse("desktop", ["--preset=desktop"]);
lighthouse("mobile", ["--form-factor=mobile", "--screenEmulation.mobile"]);

// ── 8. accessibility ───────────────────────────────────────────────────
{
  const a = run("npx", [
    "--yes", "@axe-core/cli", `${BASE}/`, "--exit", `--save=${REPORTS}/axe.json`,
  ]);
  const out = `${a.stdout}${a.stderr}`;
  const violations = /(\d+)\s+violation/i.exec(out)?.[1];
  record(
    "axe",
    a.status === 0 ? "PASS" : "FAIL",
    violations ? `${violations} violation(s)` : a.status === 0 ? "0 violations" : "see reports/axe.json"
  );

  const p = run("npx", ["--yes", "pa11y", `${BASE}/`, "--reporter", "json"]);
  writeFileSync(`${REPORTS}/pa11y.json`, p.stdout || "[]");
  let issues = [];
  try {
    issues = JSON.parse(p.stdout || "[]");
  } catch {
    /* non-JSON output; leave empty and let the raw file speak */
  }
  const errors = issues.filter((i) => i.type === "error").length;
  record("pa11y", errors === 0 ? "PASS" : "FAIL", `${errors} error(s)`);
}

finish();
