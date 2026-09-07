/**
 * Shared connection setup for standalone scripts (PostgreSQL version).
 *
 * Next loads .env itself; plain `node` does not, so every script here needs
 * the same small parser.
 */
import { readFileSync } from "node:fs";
import { resolve }      from "node:path";
import pg               from "pg";

const { Pool } = pg;

export function loadEnv() {
  try {
    for (const line of readFileSync(resolve(".env"), "utf8").split("\n")) {
      const m = /^([A-Z0-9_]+)\s*=\s*"?([^"\n\r]*)"?\s*$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    console.error("No .env found. Copy .env.example to .env first.");
    process.exit(1);
  }
}

export async function connect() {
  loadEnv();

  const cfg = {
    host:     process.env.PG_HOST     || "localhost",
    port:     Number(process.env.PG_PORT || 5432),
    database: process.env.PG_DATABASE || "terravion_crm",
    user:     process.env.PG_USER     || "postgres",
    password: process.env.PG_PASSWORD || "",
    ssl:      process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
  };

  const pool = new Pool(cfg);
  // Validate immediately
  const client = await pool.connect();
  client.release();

  return { pool, cfg };
}
