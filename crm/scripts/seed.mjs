/**
 * Seeds the CRM SQLite database with admin user and projects.
 * Run: node scripts/seed.mjs
 */
import { randomBytes } from "node:crypto";
import { hash }        from "@node-rs/argon2";
import Database        from "better-sqlite3";
import path            from "node:path";
import { readFileSync } from "node:fs";
import { resolve }      from "node:path";

// Load .env
try {
  for (const line of readFileSync(resolve(".env"), "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)\s*=\s*"?([^"\n\r]*)"?\s*$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* no .env, env vars set externally */ }

const PROJECTS = [
  { slug: "sanctuary",       name: "Sanctuary",             location: "Julkal, Shankarpally, Hyderabad, Telangana 502285" },
  { slug: "raghunath-county",name: "Raghunath County",      location: "Shankarpally–Mominpet Road, Shankarpally, Telangana" },
  { slug: "mansanpally",     name: "Terravion Mansanpally", location: "Mansanpally, West Hyderabad growth corridor" },
];

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@terravionproperties.in";
const ADMIN_NAME  = process.env.SEED_ADMIN_NAME  || "Administrator";
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: 2 };

const DB_PATH = path.resolve(process.cwd(), "crm.sqlite3");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log(`Database: ${DB_PATH}`);

// Minimal schema bootstrap (in case db.ts hasn't run yet)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    phone         TEXT,
    password_hash TEXT,
    role          TEXT NOT NULL DEFAULT 'SALES_EXECUTIVE',
    is_active     INTEGER NOT NULL DEFAULT 1,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until  TEXT,
    allowed_ips   TEXT,
    last_login_at TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS projects (
    id         TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    slug       TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'SELLING',
    approval   TEXT,
    rera_number TEXT,
    location   TEXT,
    total_acres REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Upsert projects
const upsertProject = db.prepare(`
  INSERT INTO projects (slug, name, location)
  VALUES (@slug, @name, @location)
  ON CONFLICT(slug) DO UPDATE SET name = excluded.name, location = excluded.location
`);
for (const p of PROJECTS) {
  upsertProject.run(p);
  console.log(`project  ${p.slug}`);
}

// Admin user
const password  = process.env.SEED_ADMIN_PASSWORD || randomBytes(15).toString("base64url");
const generated = !process.env.SEED_ADMIN_PASSWORD;
const hashVal   = await hash(password, ARGON);

db.prepare(`
  INSERT INTO users (email, name, password_hash, role, is_active)
  VALUES (@email, @name, @hash, 'ADMIN', 1)
  ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, is_active = 1
`).run({ email: ADMIN_EMAIL, name: ADMIN_NAME, hash: hashVal });

console.log(`\nadmin    ${ADMIN_EMAIL}`);
if (generated) {
  console.log(`password ${password}`);
  console.log(`\nSave this — it is printed once only.`);
} else {
  console.log(`password from SEED_ADMIN_PASSWORD`);
}

db.close();
