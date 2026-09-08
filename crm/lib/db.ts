import Database from "better-sqlite3";
import path from "path";

/**
 * SQLite database layer.
 *
 * Keeps the exact same tagged-template API as the previous pg/mssql modules
 * so all repo files work without any changes.
 *
 * Automatically normalizes SQL queries (stripping MSSQL dbo. prefixes,
 * mapping table names and functions).
 *
 * The DB file lives at: <project root>/crm.sqlite3
 */

const DB_PATH = path.resolve(process.cwd(), "crm.sqlite3");

const globalForDb = globalThis as unknown as { sqliteDb?: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb.sqliteDb) {
    globalForDb.sqliteDb = new Database(DB_PATH);
    globalForDb.sqliteDb.pragma("journal_mode = WAL");
    globalForDb.sqliteDb.pragma("foreign_keys = ON");
    initSchema(globalForDb.sqliteDb);
  }
  return globalForDb.sqliteDb;
}

/** Convert $N positional params (from pg) to ? (SQLite) and normalize MSSQL dialect */
function pgToSqlite(text: string, values: unknown[]): { sql: string; params: unknown[] } {
  let i = 0;
  let sql = text.replace(/\$\d+/g, () => { i++; return "?"; });

  // 1. Strip dbo. and msdb.dbo. prefixes
  sql = sql.replace(/\b(?:msdb\.)?dbo\.(\w+)/gi, "$1");

  // 2. Replace MSSQL functions
  sql = sql.replace(/\bSYSUTCDATETIME\s*\(\s*\)/gi, "datetime('now')")
           .replace(/\bGETUTCDATE\s*\(\s*\)/gi, "datetime('now')")
           .replace(/\bISNULL\s*\(/gi, "COALESCE(");

  // 3. Map CamelCase table names to standard SQLite tables (only when following SQL keywords, NOT aliases)
  const tableMap: Record<string, string> = {
    leadactivities: "lead_activities",
    auditlog: "audit_log",
    webhookdeliveries: "webhook_deliveries",
    loginhistory: "login_history",
    leadmerges: "lead_merges",
    notifications: "notifications",
    projects: "projects",
    leads: "leads",
    users: "users",
    plots: "plots",
    bookings: "bookings",
  };

  sql = sql.replace(/\b(FROM|JOIN|INTO|UPDATE|TABLE)\s+([A-Za-z0-9_]+)\b/gi, (match, clause, tbl) => {
    const lower = tbl.toLowerCase();
    if (tableMap[lower]) {
      return `${clause} ${tableMap[lower]}`;
    }
    return match;
  });

  return { sql, params: values };
}

export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  let text = strings[0];
  const rawValues: unknown[] = [];

  values.forEach((value, i) => {
    let v: unknown = value === undefined ? null : value;
    if (v instanceof Date) {
      v = v.toISOString();
    } else if (typeof v === "boolean") {
      v = v ? 1 : 0;
    }
    rawValues.push(v);
    text += `$${i + 1}` + strings[i + 1];
  });

  const { sql, params } = pgToSqlite(text, rawValues);
  const db = getDb();

  try {
    const trimmed = sql.trim().toUpperCase();
    if (
      trimmed.startsWith("INSERT") ||
      trimmed.startsWith("UPDATE") ||
      trimmed.startsWith("DELETE") ||
      trimmed.startsWith("CREATE") ||
      trimmed.startsWith("DROP") ||
      trimmed.startsWith("ALTER")
    ) {
      if (trimmed.includes("RETURNING")) {
        return db.prepare(sql).all(...params) as T[];
      }
      db.prepare(sql).run(...params);
      return [];
    } else {
      return db.prepare(sql).all(...params) as T[];
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sqlite] query error:", msg, "\nSQL:", sql, "\nParams:", params);
    throw e;
  }
}

export async function queryOne<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T | null> {
  const rows = await query<T>(strings, ...values);
  return rows[0] ?? null;
}

export type TransactionQuery = <R = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<R[]>;

export async function transaction<T>(
  fn: (tquery: TransactionQuery) => Promise<T>
): Promise<T> {
  const db = getDb();

  return new Promise<T>((resolve, reject) => {
    const txFn = db.transaction(async () => {
      const tquery: TransactionQuery = <R>(
        strings: TemplateStringsArray,
        ...values: unknown[]
      ): Promise<R[]> => query<R>(strings, ...values);

      return await fn(tquery);
    });

    try {
      resolve(txFn());
    } catch (e) {
      reject(e);
    }
  });
}

export { Database as sql };

// ── Schema bootstrap ──────────────────────────────────────────────────────────
function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id                   TEXT    NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email                TEXT    NOT NULL UNIQUE,
      name                 TEXT    NOT NULL,
      phone                TEXT,
      password_hash        TEXT,
      role                 TEXT    NOT NULL DEFAULT 'SALES_EXECUTIVE',
      is_active            INTEGER NOT NULL DEFAULT 1,
      failed_attempts      INTEGER NOT NULL DEFAULT 0,
      locked_until         TEXT,
      allowed_ips          TEXT,
      last_login_at        TEXT,
      password_changed_at  TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      two_factor_secret    TEXT,
      two_factor_enabled   INTEGER NOT NULL DEFAULT 0,
      created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT    NOT NULL DEFAULT (datetime('now')),
      CHECK (role IN ('ADMIN','SALES_MANAGER','SALES_EXECUTIVE','TELECALLER','MARKETING',
                      'FINANCE','BROKER','SUPPORT','CUSTOMER'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT    NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      slug        TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'SELLING',
      approval    TEXT,
      rera_number TEXT,
      location    TEXT,
      total_acres REAL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      CHECK (status IN ('PRE_LAUNCH','SELLING','SOLD_OUT','COMPLETED'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id               TEXT    NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      seq              INTEGER NOT NULL DEFAULT 0,
      reference        TEXT    GENERATED ALWAYS AS ('TVN-' || printf('%06d', seq)) STORED,
      name             TEXT    NOT NULL,
      phone            TEXT    NOT NULL,
      whatsapp         TEXT,
      email            TEXT,
      budget_min       REAL,
      budget_max       REAL,
      preferred_facing TEXT,
      plot_size_min    REAL,
      plot_size_max    REAL,
      project_id       TEXT    REFERENCES projects(id),
      source           TEXT    NOT NULL DEFAULT 'WEBSITE',
      stage            TEXT    NOT NULL DEFAULT 'NEW',
      quality          TEXT    NOT NULL DEFAULT 'WARM',
      score            INTEGER NOT NULL DEFAULT 0,
      campaign         TEXT,
      utm_source       TEXT,
      utm_medium       TEXT,
      utm_campaign     TEXT,
      utm_term         TEXT,
      utm_content      TEXT,
      gclid            TEXT,
      fbclid           TEXT,
      landing_page     TEXT,
      referrer         TEXT,
      owner_id         TEXT    REFERENCES users(id),
      remarks          TEXT,
      lost_reason      TEXT,
      next_follow_up_at TEXT,
      first_contacted_at TEXT,
      last_activity_at  TEXT,
      merged_into_id    TEXT   REFERENCES leads(id),
      created_at        TEXT   NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT   NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lead_activities (
      id          TEXT    NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      lead_id     TEXT    NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      user_id     TEXT    REFERENCES users(id),
      type        TEXT    NOT NULL,
      body        TEXT,
      meta_json   TEXT,
      ip          TEXT,
      user_agent  TEXT,
      browser     TEXT,
      os          TEXT,
      device_type TEXT,
      city        TEXT,
      country     TEXT,
      channel     TEXT,
      before_json TEXT,
      after_json  TEXT,
      occurred_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lead_merges (
      id            TEXT    NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      survivor_id   TEXT    NOT NULL REFERENCES leads(id),
      merged_id     TEXT    NOT NULL REFERENCES leads(id),
      matched_on    TEXT    NOT NULL,
      confidence    INTEGER NOT NULL DEFAULT 100,
      snapshot_json TEXT,
      merged_by_id  TEXT    REFERENCES users(id),
      merged_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT    REFERENCES users(id),
      action      TEXT    NOT NULL,
      entity      TEXT    NOT NULL,
      entity_id   TEXT    NOT NULL,
      before_json TEXT,
      after_json  TEXT,
      ip          TEXT,
      user_agent  TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      delivery_key TEXT NOT NULL PRIMARY KEY,
      source       TEXT NOT NULL,
      lead_id      TEXT REFERENCES leads(id),
      received_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS login_history (
      id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT    REFERENCES users(id),
      email       TEXT    NOT NULL,
      success     INTEGER NOT NULL,
      reason      TEXT,
      ip          TEXT,
      user_agent  TEXT,
      browser     TEXT,
      os          TEXT,
      device_type TEXT,
      city        TEXT,
      country     TEXT,
      occurred_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id            TEXT    NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      lead_id       TEXT    REFERENCES leads(id),
      user_id       TEXT    REFERENCES users(id),
      channel       TEXT    NOT NULL DEFAULT 'WHATSAPP',
      kind          TEXT,
      recipient     TEXT,
      subject       TEXT,
      body          TEXT,
      template_name TEXT,
      template_args TEXT,
      template      TEXT,
      payload       TEXT    NOT NULL DEFAULT '{}',
      status        TEXT    NOT NULL DEFAULT 'PENDING',
      error         TEXT,
      last_error    TEXT,
      provider_id   TEXT,
      attempts      INTEGER NOT NULL DEFAULT 0,
      scheduled_for TEXT    NOT NULL DEFAULT (datetime('now')),
      sent_at       TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plots (
      id                TEXT    NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      project_id        TEXT    NOT NULL REFERENCES projects(id),
      plot_number       TEXT    NOT NULL,
      status            TEXT    NOT NULL DEFAULT 'AVAILABLE',
      facing            TEXT,
      area_sq_yards     REAL,
      breadth_ft        REAL,
      length_ft         REAL,
      road_width        REAL,
      price_per_sq_yard REAL,
      total_price       REAL,
      is_corner         INTEGER NOT NULL DEFAULT 0,
      is_premium        INTEGER NOT NULL DEFAULT 0,
      remarks           TEXT,
      created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE (project_id, plot_number)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id            TEXT    NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      lead_id       TEXT    NOT NULL REFERENCES leads(id),
      plot_id       TEXT    NOT NULL REFERENCES plots(id),
      project_id    TEXT    NOT NULL REFERENCES projects(id),
      amount_paid   REAL,
      total_value   REAL,
      booked_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      registered_at TEXT,
      cancelled_at  TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS ix_leads_phone   ON leads (phone);
    CREATE INDEX IF NOT EXISTS ix_leads_stage   ON leads (stage, created_at);
    CREATE INDEX IF NOT EXISTS ix_leads_owner   ON leads (owner_id, created_at);
    CREATE INDEX IF NOT EXISTS ix_login_email   ON login_history (email, occurred_at);
    CREATE INDEX IF NOT EXISTS ix_audit_entity  ON audit_log (entity, entity_id, created_at);
  `);

  // Safe migrations for existing databases
  const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const userColNames = new Set(userCols.map((c) => c.name.toLowerCase()));
  if (!userColNames.has("must_change_password")) {
    db.exec("ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0");
  }
  if (!userColNames.has("password_changed_at")) {
    db.exec("ALTER TABLE users ADD COLUMN password_changed_at TEXT");
  }
  if (!userColNames.has("two_factor_secret")) {
    db.exec("ALTER TABLE users ADD COLUMN two_factor_secret TEXT");
  }
  if (!userColNames.has("two_factor_enabled")) {
    db.exec("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 0");
  }

  // Safe migrations for notifications table
  const notifCols = db.prepare("PRAGMA table_info(notifications)").all() as { name: string }[];
  const notifColNames = new Set(notifCols.map((c) => c.name.toLowerCase()));
  if (!notifColNames.has("scheduled_for")) {
    db.exec("ALTER TABLE notifications ADD COLUMN scheduled_for TEXT NOT NULL DEFAULT (datetime('now'))");
  }
  if (!notifColNames.has("sent_at")) {
    db.exec("ALTER TABLE notifications ADD COLUMN sent_at TEXT");
  }
  if (!notifColNames.has("attempts")) {
    db.exec("ALTER TABLE notifications ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0");
  }
  if (!notifColNames.has("error")) {
    db.exec("ALTER TABLE notifications ADD COLUMN error TEXT");
  }
  if (!notifColNames.has("last_error")) {
    db.exec("ALTER TABLE notifications ADD COLUMN last_error TEXT");
  }
  if (!notifColNames.has("provider_id")) {
    db.exec("ALTER TABLE notifications ADD COLUMN provider_id TEXT");
  }

  // Safe migrations for lead_activities table
  const actCols = db.prepare("PRAGMA table_info(lead_activities)").all() as { name: string }[];
  const actColNames = new Set(actCols.map((c) => c.name.toLowerCase()));
  const missingActCols: Record<string, string> = {
    ip: "TEXT",
    user_agent: "TEXT",
    browser: "TEXT",
    os: "TEXT",
    device_type: "TEXT",
    city: "TEXT",
    country: "TEXT",
    channel: "TEXT",
    before_json: "TEXT",
    after_json: "TEXT",
  };
  for (const [col, type] of Object.entries(missingActCols)) {
    if (!actColNames.has(col)) {
      try {
        db.exec(`ALTER TABLE lead_activities ADD COLUMN ${col} ${type}`);
      } catch {
        // ignore
      }
    }
  }

  // Safe migrations for leads table
  const leadCols = db.prepare("PRAGMA table_info(leads)").all() as { name: string }[];
  const leadColNames = new Set(leadCols.map((c) => c.name.toLowerCase()));
  const missingLeadCols: Record<string, string> = {
    utm_source: "TEXT",
    utm_medium: "TEXT",
    utm_campaign: "TEXT",
    utm_term: "TEXT",
    utm_content: "TEXT",
    gclid: "TEXT",
    fbclid: "TEXT",
    landing_page: "TEXT",
    referrer: "TEXT",
    remarks: "TEXT",
    lost_reason: "TEXT",
    next_follow_up_at: "TEXT",
    first_contacted_at: "TEXT",
    last_activity_at: "TEXT",
    merged_into_id: "TEXT",
  };
  for (const [col, type] of Object.entries(missingLeadCols)) {
    if (!leadColNames.has(col)) {
      try {
        db.exec(`ALTER TABLE leads ADD COLUMN ${col} ${type}`);
      } catch {
        // ignore
      }
    }
  }
}
