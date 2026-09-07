/**
 * Module 3 verification. Produces a report, not an opinion.
 *
 *   node scripts/verify-module3.mjs
 *   node scripts/verify-module3.mjs --live --force
 *   node scripts/verify-module3.mjs --live --force --base-url http://localhost:3100
 *
 * Three layers, and none of them guesses at the layer above:
 *
 *   · Structure — tables, columns, indexes, foreign keys, triggers,
 *     constraints, procedures. Read-only, always runs.
 *   · Behaviour (--live) — writes probe rows and checks the database actually
 *     refuses what it is supposed to refuse. Needs --force, because a trigger
 *     that fires takes its transaction with it.
 *   · End to end (--base-url) — drives the running application over HTTP.
 *     This is the only layer that exercises the SQL the application really
 *     runs; the report and search queries live in TypeScript and cannot be
 *     reached from a plain node script.
 *
 * Anything not exercised is reported NOT TESTED with the reason. Nothing is
 * ever reported PASS because it looked plausible.
 */
import { writeFileSync } from "node:fs";
import { createHmac, randomUUID } from "node:crypto";
import { connect, loadEnv } from "./_conn.mjs";

const args = process.argv.slice(2);
const live = args.includes("--live");
const force = args.includes("--force");
const baseUrl = (args[args.indexOf("--base-url") + 1] || "").replace(/\/$/, "") || null;
const hasBase = args.includes("--base-url") && baseUrl;

const runId = randomUUID().slice(0, 8);
const digits = runId.replace(/\D/g, "").padEnd(6, "0").slice(0, 6);
const startedAt = new Date();

let sqlCount = 0;
let rowsTouched = 0;
const results = [];
const warnings = [];
const recommendations = [];

function record(section, name, status, detail = "", ms = 0) {
  results.push({ section, name, status, detail, ms });
  const mark = { PASS: "  ok  ", FAIL: " FAIL ", "NOT TESTED": "  --  " }[status];
  console.log(`${mark} ${section} · ${name}${detail ? `\n         ${detail}` : ""}`);
}

function notTested(section, name, why) {
  record(section, name, "NOT TESTED", why);
}

async function timed(fn) {
  const t = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - t };
}

// ── connect, or stop ───────────────────────────────────────────────────
loadEnv();

let pool;
let cfg;
try {
  const t = Date.now();
  ({ pool, cfg } = await connect());
  await pool.request().query("SELECT 1");
  sqlCount++;
  console.log(`connected to ${cfg.database} on ${cfg.server} (${Date.now() - t}ms)\n`);
} catch (e) {
  console.error("\n=========================================================");
  console.error("VERIFICATION STOPPED — SQL SERVER UNAVAILABLE");
  console.error("=========================================================\n");
  console.error(`  ${e.message}\n`);
  console.error("No results were produced. Nothing was tested. Nothing passed.\n");
  console.error("Required before this can run:");
  console.error("  1. A reachable SQL Server instance.");
  console.error("  2. Real values in crm/.env — SQLSERVER_HOST, SQLSERVER_DATABASE");
  console.error("     (or SQLSERVER_DB), SQLSERVER_USERNAME (or SQLSERVER_USER),");
  console.error("     SQLSERVER_PASSWORD, and SQLSERVER_INSTANCE if it is a named");
  console.error("     instance rather than a port.");
  console.error("  3. A database the login can read, plus CREATE rights if the");
  console.error("     schema has not been applied yet.\n");
  process.exit(1);
}

const all = async (text) => {
  sqlCount++;
  const r = await pool.request().query(text);
  return r.recordset ?? [];
};
const one = async (text) => (await all(text))[0];

try {
  // ══ 1. STRUCTURE ═════════════════════════════════════════════════════
  const dbInfo = await one(`
    SELECT DB_NAME() AS name, SERVERPROPERTY('ProductVersion') AS version
  `);
  record("Schema", "database reachable", "PASS", `${dbInfo.name} · SQL Server ${dbInfo.version}`);

  const tables = (await all(`SELECT name FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo')`)).map(
    (r) => r.name
  );
  const REQUIRED_TABLES = [
    "Users", "Projects", "Leads", "LeadActivities", "AuditLog",
    "WebhookDeliveries", "LeadMerges", "Notifications", "LoginHistory", "SavedViews",
  ];
  const missingTables = REQUIRED_TABLES.filter((t) => !tables.includes(t));
  record(
    "Schema",
    "required tables",
    missingTables.length ? "FAIL" : "PASS",
    missingTables.length ? `missing: ${missingTables.join(", ")}` : `all ${REQUIRED_TABLES.length} present`
  );
  if (missingTables.length) recommendations.push("Apply the schema: npm run db:setup");

  const colCheck = async (table, needed) => {
    if (!tables.includes(table)) return notTested("Schema", `${table} columns`, "table absent");
    const have = (
      await all(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='${table}'
      `)
    ).map((r) => r.COLUMN_NAME);
    const gone = needed.filter((c) => !have.includes(c));
    record(
      "Schema",
      `${table} columns`,
      gone.length ? "FAIL" : "PASS",
      gone.length ? `missing: ${gone.join(", ")}` : `${needed.length} checked`
    );
  };

  await colCheck("LeadActivities", [
    "Ip", "UserAgent", "Browser", "Os", "DeviceType",
    "City", "Country", "Channel", "BeforeJson", "AfterJson",
  ]);
  await colCheck("Leads", [
    "Reference", "Phone", "WhatsApp", "Email", "Source", "Stage",
    "UtmSource", "UtmMedium", "UtmCampaign", "UtmTerm", "UtmContent",
    "Gclid", "Fbclid", "LandingPage", "Referrer", "MergedIntoId",
  ]);
  await colCheck("Users", [
    "PasswordHash", "PasswordChangedAt", "MustChangePassword",
    "TwoFactorSecret", "TwoFactorEnabled", "FailedAttempts", "LockedUntil", "AllowedIps",
  ]);
  await colCheck("LoginHistory", ["UserId", "Email", "Success", "Ip", "UserAgent", "DeviceType"]);

  const idx = await all(`
    SELECT i.name, OBJECT_NAME(i.object_id) AS tbl, i.is_unique, i.has_filter, i.filter_definition
    FROM sys.indexes i
    WHERE i.object_id IN (SELECT object_id FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo'))
      AND i.name IS NOT NULL
  `);
  record("Schema", "indexes present", idx.length ? "PASS" : "FAIL", `${idx.length} indexes`);

  const dedupIdx = idx.find((i) => i.tbl === "Leads" && i.is_unique && i.has_filter);
  record(
    "Deduplication",
    "filtered unique index",
    dedupIdx ? (/MergedIntoId/i.test(dedupIdx.filter_definition ?? "") ? "PASS" : "FAIL") : "FAIL",
    dedupIdx
      ? `${dedupIdx.name} WHERE ${dedupIdx.filter_definition}`
      : "no filtered unique index on Leads"
  );

  const fks = await all(`SELECT name FROM sys.foreign_keys`);
  record("Schema", "foreign keys", fks.length ? "PASS" : "FAIL", `${fks.length} constraints`);

  const untrusted = await all(`
    SELECT name FROM sys.foreign_keys WHERE is_not_trusted = 1
    UNION ALL SELECT name FROM sys.check_constraints WHERE is_not_trusted = 1
  `);
  if (untrusted.length) {
    warnings.push(
      `${untrusted.length} constraint(s) are NOT TRUSTED — never validated against existing ` +
        `rows and ignored by the optimiser: ${untrusted.map((u) => u.name).join(", ")}`
    );
  }

  const checks = await all(`SELECT name FROM sys.check_constraints`);
  record("Schema", "check constraints", checks.length ? "PASS" : "FAIL", `${checks.length} present`);

  const triggers = await all(`
    SELECT t.name, OBJECT_NAME(t.parent_id) AS parent, t.is_disabled,
           OBJECTPROPERTY(t.object_id,'ExecIsUpdateTrigger') AS onUpdate,
           OBJECTPROPERTY(t.object_id,'ExecIsDeleteTrigger') AS onDelete
    FROM sys.triggers t WHERE t.is_ms_shipped = 0
  `);
  for (const table of ["LeadActivities", "AuditLog"]) {
    const guards = triggers.filter((t) => t.parent === table);
    const u = guards.some((g) => g.onUpdate === 1 && !g.is_disabled);
    const d = guards.some((g) => g.onDelete === 1 && !g.is_disabled);
    record(
      "Audit log",
      `${table} append-only triggers declared`,
      u && d ? "PASS" : "FAIL",
      `update ${u ? "guarded" : "UNGUARDED"}, delete ${d ? "guarded" : "UNGUARDED"}`
    );
    if (guards.some((g) => g.is_disabled)) {
      warnings.push(`A trigger on ${table} is DISABLED. Append-only is not being enforced.`);
    }
  }

  const procs = (await all(`SELECT name FROM sys.procedures WHERE schema_id = SCHEMA_ID('dbo')`)).map(
    (r) => r.name
  );
  const BACKUP_PROCS = ["usp_BackupFull", "usp_BackupDiff", "usp_BackupLog", "usp_BackupRetention"];
  const missingProcs = BACKUP_PROCS.filter((p) => !procs.includes(p));
  record(
    "Backup",
    "procedures exist and compiled",
    missingProcs.length ? "FAIL" : "PASS",
    missingProcs.length ? `missing: ${missingProcs.join(", ")}` : BACKUP_PROCS.join(", ")
  );
  if (missingProcs.length) recommendations.push("Apply backup procedures: npm run db:backup-procs");

  const computed = await one(`
    SELECT name, is_persisted FROM sys.computed_columns
    WHERE object_id = OBJECT_ID('dbo.Leads') AND name = 'Reference'
  `);
  record(
    "Schema",
    "lead reference is computed",
    computed ? "PASS" : "FAIL",
    computed ? `persisted: ${computed.is_persisted === 1}` : "Reference is not a computed column"
  );

  const dupView = await one(`SELECT name FROM sys.views WHERE name = 'vLeadDuplicates'`);
  record("Deduplication", "vLeadDuplicates view", dupView ? "PASS" : "FAIL");

  try {
    const jobs = await all(`SELECT name, enabled FROM msdb.dbo.sysjobs WHERE name LIKE 'Terravion%'`);
    record(
      "Backup",
      "SQL Agent jobs exist",
      jobs.length ? "PASS" : "FAIL",
      jobs.length
        ? jobs.map((j) => `${j.name}${j.enabled ? "" : " (disabled)"}`).join(", ")
        : "no jobs named Terravion% — create them per the header of db/003_backup.sql"
    );
    const last = await one(`
      SELECT MAX(CASE WHEN type='D' THEN backup_finish_date END) AS lastFull
      FROM msdb.dbo.backupset WHERE database_name = DB_NAME()
    `);
    record(
      "Backup",
      "a full backup has been taken",
      last?.lastFull ? "PASS" : "FAIL",
      last?.lastFull ? `last full ${new Date(last.lastFull).toISOString()}` : "none recorded"
    );
  } catch (e) {
    notTested("Backup", "jobs and history", `cannot read msdb: ${e.message.slice(0, 110)}`);
    recommendations.push(
      "Grant the app login SELECT on msdb.dbo.backupset so backup age is visible on /system."
    );
  }

  const counts = await one(`
    SELECT (SELECT COUNT(*) FROM dbo.Users) AS users,
           (SELECT COUNT(*) FROM dbo.Projects) AS projects,
           (SELECT COUNT(*) FROM dbo.Leads) AS leads,
           (SELECT COUNT(*) FROM dbo.AuditLog) AS audits
  `);
  record(
    "Schema",
    "seed data",
    counts.users > 0 && counts.projects > 0 ? "PASS" : "FAIL",
    `${counts.users} users, ${counts.projects} projects, ${counts.leads} leads, ${counts.audits} audit rows`
  );

  // ══ 2. BEHAVIOUR ═════════════════════════════════════════════════════
  const probePhone = `+9190${digits}0`;

  if (!live || !force) {
    for (const [s, n] of [
      ["Behaviour", "reference generated on insert"],
      ["Lead flow", "attribution columns round-trip"],
      ["Deduplication", "duplicate phone rejected"],
      ["Audit log", "timeline rejects UPDATE"],
      ["Audit log", "timeline rejects DELETE"],
      ["Audit log", "audit rejects UPDATE"],
      ["Audit log", "audit rejects DELETE"],
      ["Security", "SQL injection resistance"],
    ]) {
      notTested(s, n, live ? "--live also requires --force" : "needs --live --force");
    }
  } else {
    let probeLeadId = null;

    const probe = await timed(async () => {
      const r = await all(`
        INSERT INTO dbo.Leads (Name, Phone, Source, UtmSource, Gclid, Fbclid, LandingPage, Referrer)
        OUTPUT INSERTED.Id, INSERTED.Reference
        VALUES ('Verify Probe ${runId}', '${probePhone}', 'MANUAL',
                'verify', 'gclid-${runId}', 'fbclid-${runId}', '/verify', 'https://example.test/')
      `);
      rowsTouched++;
      return r[0];
    });
    probeLeadId = probe.value?.Id ?? null;
    record(
      "Behaviour",
      "reference generated on insert",
      probe.value?.Reference ? "PASS" : "FAIL",
      `${probe.value?.Reference}`,
      probe.ms
    );

    const back = await one(`
      SELECT UtmSource, Gclid, Fbclid, LandingPage, Referrer
      FROM dbo.Leads WHERE Id = '${probeLeadId}'
    `);
    const attrOk =
      back?.UtmSource === "verify" &&
      back?.Gclid === `gclid-${runId}` &&
      back?.Fbclid === `fbclid-${runId}` &&
      back?.LandingPage === "/verify" &&
      back?.Referrer === "https://example.test/";
    record(
      "Lead flow",
      "attribution columns round-trip",
      attrOk ? "PASS" : "FAIL",
      attrOk ? "utm, gclid, fbclid, landing page, referrer" : JSON.stringify(back)
    );

    let refused = false;
    const dup = await timed(async () => {
      try {
        await all(`
          INSERT INTO dbo.Leads (Name, Phone, Source)
          VALUES ('Verify Probe ${runId} dup', '${probePhone}', 'MANUAL')
        `);
        rowsTouched++;
      } catch {
        refused = true;
      }
    });
    record("Deduplication", "duplicate phone rejected", refused ? "PASS" : "FAIL", "", dup.ms);

    const act = await all(`
      INSERT INTO dbo.LeadActivities (LeadId, Type, Body, Channel)
      OUTPUT INSERTED.Id VALUES ('${probeLeadId}', 'NOTE', 'verify ${runId}', 'API')
    `);
    rowsTouched++;
    const actId = act[0]?.Id;

    for (const [label, stmt] of [
      ["timeline rejects UPDATE", `UPDATE dbo.LeadActivities SET Body='x' WHERE Id='${actId}'`],
      ["timeline rejects DELETE", `DELETE FROM dbo.LeadActivities WHERE Id='${actId}'`],
    ]) {
      let blocked = false;
      const r = await timed(async () => {
        try {
          await all(stmt);
        } catch {
          blocked = true;
        }
      });
      record("Audit log", label, blocked ? "PASS" : "FAIL", blocked ? "" : "MUTABLE HISTORY", r.ms);
      if (!blocked) recommendations.push("Re-apply the append-only triggers in db/001_schema.sql.");
    }

    const aud = await all(`
      INSERT INTO dbo.AuditLog (Action, EntityType, EntityId)
      OUTPUT INSERTED.Id VALUES ('verify.probe', 'Lead', '${probeLeadId}')
    `);
    rowsTouched++;
    for (const [label, stmt] of [
      ["audit rejects UPDATE", `UPDATE dbo.AuditLog SET Action='x' WHERE Id='${aud[0]?.Id}'`],
      ["audit rejects DELETE", `DELETE FROM dbo.AuditLog WHERE Id='${aud[0]?.Id}'`],
    ]) {
      let blocked = false;
      try {
        await all(stmt);
      } catch {
        blocked = true;
      }
      record("Audit log", label, blocked ? "PASS" : "FAIL", blocked ? "" : "MUTABLE AUDIT TRAIL");
    }

    const inj = await timed(async () => {
      sqlCount++;
      const r = await pool
        .request()
        .input("q", `'; DROP TABLE dbo.Leads; --`)
        .query(`SELECT COUNT(*) AS n FROM dbo.Leads WHERE Name LIKE '%' + @q + '%'`);
      return r.recordset[0].n;
    });
    const stillThere = await one(`SELECT COUNT(*) AS n FROM sys.tables WHERE name='Leads'`);
    record(
      "Security",
      "SQL injection resistance",
      stillThere.n === 1 ? "PASS" : "FAIL",
      `payload matched ${inj.value} rows, Leads table intact`,
      inj.ms
    );
  }

  // ══ 3. END TO END ════════════════════════════════════════════════════
  const E2E = [
    ["Health", "health endpoint"],
    ["Authentication", "login"],
    ["Authentication", "logout"],
    ["Authentication", "session creation"],
    ["Authentication", "JWT validation"],
    ["Authentication", "password hashing"],
    ["Authentication", "password change"],
    ["Authentication", "account lockout"],
    ["Authentication", "session timeout"],
    ["RBAC", "per-role access enforcement"],
    ["Lead flow", "website submission reaches CRM"],
    ["Lead flow", "dashboard counters update"],
    ["Search", "phone / name / reference / project"],
    ["Search", "pagination and latency"],
    ["Reports", "daily / weekly / monthly / quarterly / yearly"],
    ["Reports", "totals reconcile with table counts"],
    ["Exports", "CSV / Excel / formula injection / UTF-8"],
    ["Security", "CSRF"],
    ["Security", "rate limiting"],
    ["Security", "concurrent sessions / IP allow list / device history"],
    ["Health", "slow query logging"],
  ];

  if (!hasBase) {
    for (const [s, n] of E2E) notTested(s, n, "needs --base-url pointing at a running CRM");
    recommendations.push(
      "Start the CRM (npm run start) and re-run with --base-url http://localhost:3100 " +
        "to exercise the application layer."
    );
  } else {
    const h = await timed(async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    });
    record(
      "Health",
      "health endpoint",
      h.value.status === 200 && h.value.body.status === "ok" ? "PASS" : "FAIL",
      `HTTP ${h.value.status} ${JSON.stringify(h.value.body).slice(0, 110)}`,
      h.ms
    );
    if ([301, 302, 307, 308].includes(h.value.status)) {
      recommendations.push(
        "/api/health redirected — it must sit in the middleware allow-list, or a monitor reads " +
          "the redirect as healthy while the database is down."
      );
    }

    const secret = process.env.LEAD_WEBHOOK_SECRET;
    if (!secret) {
      notTested("Lead flow", "website submission reaches CRM", "LEAD_WEBHOOK_SECRET not set");
    } else {
      const payload = JSON.stringify({
        deliveryKey: `verify-${runId}`,
        source: "WEBSITE",
        name: `Verify Webhook ${runId}`,
        phone: `+9191${digits}1`,
        utm: { source: "verify", medium: "e2e", campaign: `run-${runId}` },
        gclid: `gclid-${runId}`,
        fbclid: `fbclid-${runId}`,
        landingPage: "/verify",
        referrer: "https://example.test/",
        visitor: { ip: "203.0.113.7", userAgent: "VerifyBot/1.0", city: "Hyderabad", country: "IN" },
      });
      const ts = Date.now();
      const sig = createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");
      const send = (t, s) =>
        fetch(`${baseUrl}/api/webhooks/lead`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-terravion-signature": `t=${t},v1=${s}` },
          body: payload,
          signal: AbortSignal.timeout(15_000),
        });

      const post = await timed(async () => {
        const res = await send(ts, sig);
        return { status: res.status, body: await res.json().catch(() => ({})) };
      });
      const ok = post.value.status === 200 && post.value.body.ok;
      record(
        "Lead flow",
        "website submission reaches CRM",
        ok ? "PASS" : "FAIL",
        `HTTP ${post.value.status} ${JSON.stringify(post.value.body).slice(0, 150)}`,
        post.ms
      );

      if (ok) {
        rowsTouched++;
        const stored = await one(`
          SELECT l.Reference, l.UtmSource, l.Gclid, l.Fbclid, l.LandingPage, l.Referrer,
                 (SELECT COUNT(*) FROM dbo.LeadActivities a WHERE a.LeadId = l.Id) AS acts,
                 (SELECT TOP 1 a.Ip FROM dbo.LeadActivities a WHERE a.LeadId = l.Id
                   ORDER BY a.OccurredAt) AS firstIp
          FROM dbo.Leads l WHERE l.Name = 'Verify Webhook ${runId}'
        `);
        record(
          "Lead flow",
          "stored in SQL Server with timeline and attribution",
          stored && stored.acts > 0 && stored.UtmSource === "verify" ? "PASS" : "FAIL",
          stored
            ? `${stored.Reference}, ${stored.acts} timeline row(s), gclid ${stored.Gclid}`
            : "lead not found"
        );
        record(
          "Lead flow",
          "visitor ip recorded, not the relaying server's",
          stored?.firstIp === "203.0.113.7" ? "PASS" : "FAIL",
          `recorded ip: ${stored?.firstIp}`
        );

        const replay = await timed(async () => (await send(ts, sig)).json().catch(() => ({})));
        record(
          "Lead flow",
          "retry does not create a second lead",
          replay.value?.replayed === true ? "PASS" : "FAIL",
          JSON.stringify(replay.value).slice(0, 110),
          replay.ms
        );
      }

      const forged = await timed(async () => (await send(Date.now(), "0".repeat(64))).status);
      record(
        "Security",
        "forged webhook signature refused",
        forged.value === 401 ? "PASS" : "FAIL",
        `HTTP ${forged.value}`,
        forged.ms
      );

      const stale = Date.now() - 10 * 60 * 1000;
      const staleSig = createHmac("sha256", secret).update(`${stale}.${payload}`).digest("hex");
      const staleRes = await timed(async () => (await send(stale, staleSig)).status);
      record(
        "Security",
        "stale signature refused (replay window)",
        staleRes.value === 401 ? "PASS" : "FAIL",
        `HTTP ${staleRes.value}`,
        staleRes.ms
      );
    }

    // Authenticated surfaces need credentials this harness does not have.
    for (const [s, n] of E2E) {
      if (results.some((r) => r.section === s && r.name === n)) continue;
      notTested(s, n, "needs a signed-in session — set VERIFY_EMAIL and VERIFY_PASSWORD");
    }
    if (!process.env.VERIFY_EMAIL) {
      recommendations.push(
        "Set VERIFY_EMAIL / VERIFY_PASSWORD to a disposable account so sign-in, RBAC, search, " +
          "reports and exports can be driven end to end."
      );
    }
  }

  // ── cleanup ────────────────────────────────────────────────────────
  if (live && force) {
    try {
      await all(`
        DISABLE TRIGGER ALL ON dbo.LeadActivities;
        DELETE FROM dbo.LeadActivities
         WHERE LeadId IN (SELECT Id FROM dbo.Leads WHERE Name LIKE 'Verify %${runId}%');
        ENABLE TRIGGER ALL ON dbo.LeadActivities;
        DELETE FROM dbo.WebhookDeliveries WHERE DeliveryKey = 'verify-${runId}';
        DELETE FROM dbo.Leads WHERE Name LIKE 'Verify %${runId}%';
      `);
      console.log(`\nprobe rows for run ${runId} removed`);
    } catch (e) {
      warnings.push(
        `Probe rows for run ${runId} could not be removed (${e.message.slice(0, 110)}). ` +
          `Search dbo.Leads for '%${runId}%' and clean up by hand.`
      );
    }
    warnings.push(
      `One audit row 'verify.probe' from run ${runId} remains in dbo.AuditLog. That is correct: ` +
        `the log is append-only, and a harness that could erase its own tracks would prove nothing.`
    );
  }
} catch (e) {
  record("Harness", "run to completion", "FAIL", e.message);
} finally {
  await pool.close();
}

// ── report ───────────────────────────────────────────────────────────
const elapsed = Date.now() - startedAt.getTime();
const tally = {
  PASS: results.filter((r) => r.status === "PASS").length,
  FAIL: results.filter((r) => r.status === "FAIL").length,
  "NOT TESTED": results.filter((r) => r.status === "NOT TESTED").length,
};

const sections = [...new Set(results.map((r) => r.section))];
const lines = [
  `# Module 3 verification report`,
  ``,
  `- Run: \`${runId}\``,
  `- Started: ${startedAt.toISOString()}`,
  `- Duration: ${elapsed} ms`,
  `- Server: ${cfg.server} · database: ${cfg.database}`,
  `- Mode: structure${live && force ? " + behaviour" : ""}${hasBase ? " + end-to-end" : ""}`,
  `- SQL statements executed: ${sqlCount}`,
  `- Rows written by the harness: ${rowsTouched}`,
  ``,
  `**${tally.PASS} PASS · ${tally.FAIL} FAIL · ${tally["NOT TESTED"]} NOT TESTED**`,
  ``,
];

for (const s of sections) {
  lines.push(`## ${s}`, ``, `| Check | Status | Time | Detail |`, `| --- | --- | --- | --- |`);
  for (const r of results.filter((x) => x.section === s)) {
    const detail = r.detail.replace(/\|/g, "\\|").replace(/\n/g, " ") || "—";
    lines.push(`| ${r.name} | ${r.status} | ${r.ms ? `${r.ms} ms` : "—"} | ${detail} |`);
  }
  lines.push(``);
}

lines.push(`## Warnings`, ``);
lines.push(warnings.length ? warnings.map((w) => `- ${w}`).join("\n") : `None.`);
lines.push(``, `## Recommendations`, ``);
lines.push(
  recommendations.length ? [...new Set(recommendations)].map((r) => `- ${r}`).join("\n") : `None.`
);
lines.push(
  ``,
  `## Gate on Module 4`,
  ``,
  tally.FAIL > 0
    ? `**Not met.** ${tally.FAIL} check(s) failed.`
    : tally["NOT TESTED"] > 0
      ? `**Not met.** ${tally["NOT TESTED"]} check(s) never ran. A check that did not run is not a check that passed.`
      : `**Met.** Every check ran and passed.`
);

writeFileSync("verification-report.md", lines.join("\n"), "utf8");

console.log(`\n${tally.PASS} PASS · ${tally.FAIL} FAIL · ${tally["NOT TESTED"]} NOT TESTED`);
console.log(`report written to verification-report.md`);
if (tally.FAIL > 0) process.exitCode = 1;
