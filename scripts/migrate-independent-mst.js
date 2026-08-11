#!/usr/bin/env node
/**
 * One-off data fix: copies ONLY independent_mst from local MySQL (connectlocal_website) into
 * Neon Postgres.
 *
 * WHY THIS EXISTS
 * independent_mst was included in the original bulk migration (scripts/migrate-to-neon.js), but
 * a diagnostic (scripts/check-independent-mst.ts) confirmed it ended up completely empty in Neon
 * (0 rows, all typ_id) — which is why /members/view_industry_list showed "0 of 0 industry
 * categories" for typ_id=7 (Industries). The app code itself was already correct; the data just
 * never made it across for this one table.
 *
 * This script does NOT re-run the full migration (that would TRUNCATE + re-copy all ~90 tables
 * and clobber any live Neon-only data/edits made since). It only touches independent_mst, using
 * the exact same copy logic (enum coercion for the `status` column, batch insert, sequence fix)
 * as the original script's migrateTable() function.
 *
 * Safe to re-run: independent_mst in Neon is TRUNCATEd before each copy, same as the original
 * script — safe here specifically because this table currently has 0 rows in Neon, so there is
 * nothing to lose. If you've since added rows to independent_mst directly in Neon (e.g. via the
 * Industry Manager UI) BEFORE running this, do not run this script — it would wipe those out.
 * (Re-run scripts/check-independent-mst.ts first if unsure.)
 *
 * PREREQUISITES:
 *   1. Local MySQL server running and reachable at the same connection the app used before
 *      (127.0.0.1:3307 / connectlocal_website), OR set OLD_MYSQL_URL to point elsewhere.
 *   2. mysql2 installed: npm install --no-save mysql2   (skip if already installed)
 *
 * RUN:
 *   node scripts/migrate-independent-mst.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const { Pool } = require("pg");

const MYSQL_URL = process.env.OLD_MYSQL_URL || "mysql://root:Geecon0404@127.0.0.1:3307/connectlocal_website";
const PG_URL = process.env.DATABASE_URL;
const TABLE = "independent_mst";

if (!PG_URL) {
  console.error("DATABASE_URL is not set (expected the Neon Postgres URL). Aborting.");
  process.exit(1);
}

const ZERO_DATE_RE = /^0000-00-00/;

// Same enum-safety net as the main migration script — independent_mst.status is a NOT NULL
// enum (independent_mst_status: "enabled" | "disabled") with no DB-level default Prisma is
// aware of, so a value MySQL doesn't have a matching Postgres enum member for needs a fallback.
const STATUS_ENUM_VALUES = ["enabled", "disabled"];
const STATUS_DEFAULT = "enabled";

function cleanValue(v) {
  if (v === undefined) return null;
  if (Buffer.isBuffer(v)) {
    return v.length > 0 && (v[0] & 1) === 1;
  }
  if (typeof v === "string" && ZERO_DATE_RE.test(v.trim())) {
    return "1970-01-01 00:00:00";
  }
  return v;
}

function coerceStatus(value) {
  if (value !== null && value !== undefined && STATUS_ENUM_VALUES.includes(value)) {
    return { value, coerced: false };
  }
  return { value: STATUS_DEFAULT, coerced: true };
}

async function main() {
  console.log("Connecting to source MySQL:", MYSQL_URL.replace(/:[^:@]*@/, ":****@"));
  const mysqlConn = await mysql.createConnection({ uri: MYSQL_URL, dateStrings: true });

  console.log("Connecting to target Neon Postgres...");
  const pgPool = new Pool({ connectionString: PG_URL });

  try {
    const [rows] = await mysqlConn.query(`SELECT * FROM \`${TABLE}\``);
    console.log(`Source MySQL ${TABLE}: ${rows.length} rows found.`);

    if (rows.length === 0) {
      console.log("Nothing to copy — local MySQL table is also empty. Aborting without changes.");
      return;
    }

    // Safety check: refuse to clobber if Neon already has rows (this script is meant for the
    // "currently empty" case confirmed by check-independent-mst.ts).
    const existingCountRes = await pgPool.query(`SELECT COUNT(*)::int AS count FROM "${TABLE}"`);
    const existingCount = existingCountRes.rows[0].count;
    if (existingCount > 0) {
      console.error(
        `Neon's ${TABLE} already has ${existingCount} row(s). Refusing to run — re-check with ` +
          `scripts/check-independent-mst.ts before proceeding, this script is only for the empty case.`
      );
      process.exit(1);
    }

    const columns = Object.keys(rows[0]);
    const quotedCols = columns.map((c) => `"${c}"`).join(", ");
    const statusIdx = columns.indexOf("status");

    await pgPool.query(`TRUNCATE TABLE "${TABLE}" RESTART IDENTITY CASCADE`);

    const BATCH_SIZE = 500;
    let inserted = 0;
    let errors = 0;
    let coercions = 0;

    function prepareRow(row) {
      return columns.map((c, idx) => {
        let v = cleanValue(row[c]);
        if (idx === statusIdx) {
          const { value, coerced } = coerceStatus(v);
          if (coerced) coercions += 1;
          v = value;
        }
        return v;
      });
    }

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const values = [];
      const placeholders = batch.map((row, rowIdx) => {
        const rowValues = prepareRow(row);
        const rowPlaceholders = rowValues.map((_, colIdx) => {
          values.push(rowValues[colIdx]);
          return `$${rowIdx * columns.length + colIdx + 1}`;
        });
        return `(${rowPlaceholders.join(", ")})`;
      });
      const sql = `INSERT INTO "${TABLE}" (${quotedCols}) VALUES ${placeholders.join(", ")}`;
      try {
        await pgPool.query(sql, values);
        inserted += batch.length;
      } catch (batchErr) {
        for (const row of batch) {
          const rowValues = prepareRow(row);
          const rowPlaceholders = rowValues.map((_, idx) => `$${idx + 1}`).join(", ");
          try {
            await pgPool.query(`INSERT INTO "${TABLE}" (${quotedCols}) VALUES (${rowPlaceholders})`, rowValues);
            inserted += 1;
          } catch (rowErr) {
            errors += 1;
            console.error(`  failed to insert row (id=${JSON.stringify(row.id)}): ${rowErr.message}`);
          }
        }
      }
    }

    await pgPool.query(
      `SELECT setval(pg_get_serial_sequence('"${TABLE}"', 'id'), COALESCE((SELECT MAX("id") FROM "${TABLE}"), 1))`
    );

    console.log(
      `\nDone: ${inserted}/${rows.length} rows copied into Neon's ${TABLE}` +
        `${errors ? `, ${errors} FAILED` : ""}${coercions ? `, ${coercions} status value(s) coerced` : ""}.`
    );

    const byType = await pgPool.query(
      `SELECT typ_id, COUNT(*)::int AS count FROM "${TABLE}" GROUP BY typ_id ORDER BY typ_id`
    );
    console.log("\nRow counts by typ_id after copy:");
    for (const r of byType.rows) {
      const marker = r.typ_id === 7 ? "   <-- Industries (view_industry_list)" : "";
      console.log(`  typ_id=${r.typ_id ?? "NULL"}: ${r.count} rows${marker}`);
    }
  } finally {
    await mysqlConn.end();
    await pgPool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
