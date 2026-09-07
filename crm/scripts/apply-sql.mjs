/**
 * Applies a .sql file to SQL Server, splitting on GO batch separators.
 *
 *   node scripts/apply-sql.mjs db/001_schema.sql
 *
 * The mssql driver sends one batch per request, and `GO` is a client-side
 * separator the server does not understand — sending the file whole fails on
 * the first one.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { connect } from "./_conn.mjs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/apply-sql.mjs <file.sql>");
  process.exit(1);
}

const text = readFileSync(resolve(file), "utf8");
// split on a line containing only GO (case-insensitive), not the letters "go"
const batches = text
  .split(/^\s*GO\s*$/gim)
  .map((b) => b.trim())
  .filter(Boolean);

const { pool, cfg } = await connect();
console.log(`connected to ${cfg.database} on ${cfg.server}`);

let n = 0;
try {
  for (const batch of batches) {
    await pool.request().batch(batch);
    n++;
  }
  console.log(`applied ${n}/${batches.length} batches from ${file}`);
} catch (e) {
  console.error(`\nfailed on batch ${n + 1}:\n`);
  console.error(batches[n]?.slice(0, 400));
  console.error(`\n${e.message}`);
  process.exitCode = 1;
} finally {
  await pool.close();
}
