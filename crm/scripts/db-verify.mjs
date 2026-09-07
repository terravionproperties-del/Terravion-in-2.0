/**
 * Proves the database actually enforces what the application assumes.
 *
 *   node scripts/db-verify.mjs                 structural checks, read-only
 *   node scripts/db-verify.mjs --live --force  also exercises the constraints
 *
 * Typecheck and build prove the TypeScript agrees with itself. They cannot
 * prove that an append-only trigger fires, that the dedup index carries the
 * right filter, or that a computed column produces the reference format the UI
 * prints. Those live in the server, and this is how they get checked.
 *
 * `--live` writes probe rows and removes them. It also requires --force,
 * because a cleanup is not a guarantee: a trigger that RAISERRORs takes the
 * surrounding transaction with it, and recovering from a half-applied probe on
 * a database holding real enquiries is not a thing to discover at 2am.
 *
 * Exit code is non-zero if any check fails, so CI can gate on it.
 */
import { connect } from "./_conn.mjs";

const live = process.argv.includes("--live");
const force = process.argv.includes("--force");

let pass = 0;
let fail = 0;

function check(name, ok, detail) {
  if (ok) {
    pass++;
    console.log(`  ok    ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
  }
}

const { pool, cfg } = await connect();

try {
  const t0 = Date.now();
  await pool.request().query("SELECT 1");
  console.log(`connected to ${cfg.database} on ${cfg.server} (${Date.now() - t0}ms)\n`);

  const one = async (sql) => (await pool.request().query(sql)).recordset[0];
  const all = async (sql) => (await pool.request().query(sql)).recordset;

  // ── tables ───────────────────────────────────────────────────────────
  console.log("tables");
  const tables = (await all(`SELECT name FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo')`)).map(
    (r) => r.name
  );
  for (const t of [
    "Users",
    "Projects",
    "Leads",
    "LeadActivities",
    "AuditLog",
    "WebhookDeliveries",
    "LeadMerges",
    "Notifications",
    "LoginHistory",
    "SavedViews",
  ]) {
    check(t, tables.includes(t), "run: npm run db:schema && npm run db:module3");
  }

  // ── append-only enforcement ──────────────────────────────────────────
  console.log("\nappend-only triggers");
  const triggers = await all(`
    SELECT t.name, OBJECT_NAME(t.parent_id) AS parent,
           OBJECTPROPERTY(t.object_id, 'ExecIsUpdateTrigger') AS onUpdate,
           OBJECTPROPERTY(t.object_id, 'ExecIsDeleteTrigger') AS onDelete
    FROM sys.triggers t WHERE t.is_ms_shipped = 0
  `);
  for (const table of ["LeadActivities", "AuditLog"]) {
    const guards = triggers.filter((t) => t.parent === table);
    check(
      `${table} blocks UPDATE`,
      guards.some((g) => g.onUpdate === 1),
      "history that can be edited is not history"
    );
    check(
      `${table} blocks DELETE`,
      guards.some((g) => g.onDelete === 1),
      "history that can be erased is not history"
    );
  }

  // ── dedup index ──────────────────────────────────────────────────────
  console.log("\ndeduplication");
  const dedup = await one(`
    SELECT i.name, i.is_unique, i.has_filter, i.filter_definition
    FROM sys.indexes i
    WHERE i.object_id = OBJECT_ID('dbo.Leads') AND i.has_filter = 1 AND i.is_unique = 1
  `);
  check("filtered unique index on Leads", !!dedup, "one phone per project must be unrepeatable");
  if (dedup) {
    check(
      "index excludes merged leads",
      /MergedIntoId/i.test(dedup.filter_definition ?? ""),
      `filter is: ${dedup.filter_definition}`
    );
  }

  const view = await one(`SELECT name FROM sys.views WHERE name = 'vLeadDuplicates'`);
  check("vLeadDuplicates view", !!view);

  // ── computed reference ───────────────────────────────────────────────
  console.log("\nlead reference");
  const computed = await one(`
    SELECT name, is_persisted
    FROM sys.computed_columns WHERE object_id = OBJECT_ID('dbo.Leads') AND name = 'Reference'
  `);
  check("Reference is a computed column", !!computed);
  if (computed) {
    check(
      "Reference is persisted",
      computed.is_persisted === 1,
      "an unpersisted computed column cannot be indexed, and this one is searched"
    );
  }

  // ── forensic columns Module 3 depends on ─────────────────────────────
  console.log("\ntimeline forensics");
  const cols = (
    await all(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'LeadActivities'
    `)
  ).map((r) => r.COLUMN_NAME);
  for (const c of [
    "Ip",
    "UserAgent",
    "Browser",
    "Os",
    "DeviceType",
    "City",
    "Country",
    "Channel",
    "BeforeJson",
    "AfterJson",
  ]) {
    check(`LeadActivities.${c}`, cols.includes(c), "run: npm run db:module3");
  }

  console.log("\nsecurity columns");
  const userCols = (
    await all(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Users'
    `)
  ).map((r) => r.COLUMN_NAME);
  for (const c of ["FailedAttempts", "LockedUntil", "AllowedIps", "PasswordChangedAt"]) {
    check(`Users.${c}`, userCols.includes(c));
  }

  const loginCols = (
    await all(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'LoginHistory'
    `)
  ).map((r) => r.COLUMN_NAME);
  // Without this one, recordLogin throws and nobody can sign in at all.
  check("LoginHistory.DeviceType", loginCols.includes("DeviceType"), "run: npm run db:security");

  // ── seeded reality ───────────────────────────────────────────────────
  console.log("\ndata");
  const counts = await one(`
    SELECT (SELECT COUNT(*) FROM dbo.Users)    AS users,
           (SELECT COUNT(*) FROM dbo.Projects) AS projects,
           (SELECT COUNT(*) FROM dbo.Leads)    AS leads
  `);
  check("at least one user exists", counts.users > 0, "run: npm run db:seed");
  check("projects seeded", counts.projects > 0, "run: npm run db:seed");
  console.log(`        ${counts.leads} lead(s) currently recorded`);

  // ── behavioural checks ───────────────────────────────────────────────
  if (live && !force) {
    console.log("\n--live also needs --force. Skipping behavioural checks.");
  } else if (live) {
    console.log("\nbehaviour (probe rows, removed afterwards)");

    // Each negative test gets its own statement rather than sharing one
    // transaction: the append-only trigger aborts whatever transaction it
    // fires inside, so the first success would take the rest down with it.
    const probePhone = "+919000000001";
    let probeId = null;

    try {
      const r = await pool.request().input("p", probePhone).query(`
        INSERT INTO dbo.Leads (Name, Phone, Source)
        OUTPUT INSERTED.Id, INSERTED.Reference
        VALUES ('Verification Probe', @p, 'MANUAL')
      `);
      probeId = r.recordset[0].Id;
      check(
        "reference generated on insert",
        /\d/.test(r.recordset[0].Reference ?? ""),
        `got: ${r.recordset[0].Reference}`
      );

      let refused = false;
      try {
        await pool.request().input("p", probePhone).query(`
          INSERT INTO dbo.Leads (Name, Phone, Source)
          VALUES ('Verification Probe 2', @p, 'MANUAL')
        `);
      } catch {
        refused = true;
      }
      check("duplicate phone refused by the index", refused);

      const act = await pool.request().input("id", probeId).query(`
        INSERT INTO dbo.LeadActivities (LeadId, Type, Body, Channel)
        OUTPUT INSERTED.Id
        VALUES (@id, 'NOTE', 'verification probe', 'API')
      `);
      const actId = act.recordset[0].Id;

      let updateBlocked = false;
      try {
        await pool
          .request()
          .input("a", actId)
          .query(`UPDATE dbo.LeadActivities SET Body = 'tampered' WHERE Id = @a`);
      } catch {
        updateBlocked = true;
      }
      check("timeline entry cannot be edited", updateBlocked);

      let deleteBlocked = false;
      try {
        await pool.request().input("a", actId).query(`DELETE FROM dbo.LeadActivities WHERE Id = @a`);
      } catch {
        deleteBlocked = true;
      }
      check("timeline entry cannot be deleted", deleteBlocked);
    } finally {
      if (probeId) {
        // The trigger that just proved itself now has to be stepped around.
        // This is the one place the append-only rule is inconvenient, and it
        // is inconvenient on purpose — note that it needs ALTER on the table,
        // which an application login should not hold.
        try {
          await pool.request().input("id", probeId).query(`
            DISABLE TRIGGER ALL ON dbo.LeadActivities;
            DELETE FROM dbo.LeadActivities WHERE LeadId = @id;
            ENABLE TRIGGER ALL ON dbo.LeadActivities;
            DELETE FROM dbo.Leads WHERE Id = @id;
          `);
          console.log("        probe rows removed");
        } catch (e) {
          console.log(`        could not remove probe rows: ${e.message}`);
          console.log(`        lead ${probeId} needs manual cleanup`);
        }
      }
    }
  } else {
    console.log("\nBehavioural checks skipped. Re-run with --live --force on a disposable database.");
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
} catch (e) {
  console.error(`\nverification could not run: ${e.message}`);
  process.exitCode = 1;
} finally {
  await pool.close();
}
