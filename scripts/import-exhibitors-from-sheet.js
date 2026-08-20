#!/usr/bin/env node
/**
 * ===========================================================================
 *  ONE-OFF IMPORT: exhibitor onboarding sheet -> find_event_exhibitor
 * ===========================================================================
 *
 *  WHY THIS EXISTS
 *
 *  The legacy MySQL snapshot this database was migrated from ends around
 *  3 July 2026. Everything onboarded after that — including the current
 *  exhibitor intake — was entered in the old production database (Neon), which
 *  is past its data-transfer quota and refuses connections, so it could not be
 *  copied across. The intake also exists as a Google Sheet, which is where this
 *  script reads it from.
 *
 *  Confirmed before writing: none of the sheet's companies already exist on
 *  this event (zero overlap against the 420 rows already there), so this is
 *  purely additive.
 *
 *  WHAT IT DOES
 *
 *    1. Writes every existing row for the event to a local JSON backup.
 *    2. Deletes the event's `active` rows — a batch registered 9-22 Sept 2025
 *       whose companies are unrelated to the current intake. The 39 `pending`
 *       rows are LEFT ALONE: some are as recent as May 2026 and are not part of
 *       that stale batch.
 *    3. Inserts each sheet row as `pending`, so nothing appears on the public
 *       /exhibitors directory until someone approves it in the CP.
 *
 *  NOTE ON THE PUBLIC PAGE: /exhibitors renders `status='active'` only. Because
 *  step 2 removes the actives and step 3 adds only pendings, the public
 *  directory will be EMPTY until rows are approved. That is deliberate — an
 *  empty list is more honest than 381 companies who never exhibited at this
 *  show — but it is a visible change, so it is called out here rather than
 *  discovered later.
 *
 *  DELIBERATELY NOT DONE: no logins. The sheet carries plaintext passwords and
 *  was world-readable, so those credentials must be treated as compromised and
 *  reset rather than loaded into find_users. Exhibitor records only.
 *
 *  USAGE
 *      node scripts/import-exhibitors-from-sheet.js            # dry run
 *      node scripts/import-exhibitors-from-sheet.js --confirm  # writes
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const SHEET_ID = process.env.EXHIBITOR_SHEET_ID || "12B9n2C4otEYsOBFTz66zZ7BE-Y2Q17FS_vg9Vj3Emqo";
// The gviz endpoint quotes every field, so embedded commas in company names parse correctly.
// `export?format=csv` does not, and several company names contain commas.
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

const EVENT_ID = 1474;
const CONFIRM = process.argv.includes("--confirm");
const BACKUP_DIR = path.join(__dirname, "..", "database");

const PG_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!PG_URL) {
  console.error("DATABASE_URL is not set. Aborting.");
  process.exit(1);
}

/** Minimal RFC4180 parser — handles quoted fields, embedded commas and escaped quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const clean = (v) => (v == null ? "" : String(v).trim());

async function main() {
  console.log(`Fetching sheet ${SHEET_ID}...`);
  const res = await fetch(SHEET_URL);
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`);
  const rows = parseCsv(await res.text());
  if (!rows.length) throw new Error("Sheet is empty.");

  const header = rows[0].map((h) => clean(h).toLowerCase());
  const col = (name) => header.indexOf(name);
  const iName = col("name");
  const iEmail = col("email");
  const iPhone = col("phone");
  const iCompany = col("exhibitor company name");
  const iWebsite = col("website");
  const iSource = col("source");
  const iStandReady = col("stand ready");

  if (iCompany < 0) throw new Error(`Could not find "Exhibitor Company Name" column. Header: ${header.join(" | ")}`);

  const records = [];
  let skipped = 0;
  for (const r of rows.slice(1)) {
    const business = clean(r[iCompany]);
    if (!business) {
      skipped++;
      continue; // a row with no company is not an exhibitor
    }
    const fullName = clean(r[iName]);
    const parts = fullName.split(/\s+/).filter(Boolean);
    records.push({
      business,
      name: fullName,
      first_name: parts[0] ?? "",
      last_name: parts.slice(1).join(" "),
      email: clean(r[iEmail]),
      phone: clean(r[iPhone]),
      website: clean(r[iWebsite]),
      source: clean(r[iSource]),
      standReady: /yes/i.test(clean(r[iStandReady])),
    });
  }

  console.log(`  parsed ${records.length} exhibitor row(s)${skipped ? `, skipped ${skipped} with no company name` : ""}`);
  console.log(`  ${records.filter((r) => r.standReady).length} marked "Stand Ready = yes"`);

  const pool = new Pool({ connectionString: PG_URL });
  try {
    const existing = await pool.query(
      `SELECT status, COUNT(*)::int AS n FROM find_event_exhibitor WHERE event_id = $1 GROUP BY status`,
      [EVENT_ID]
    );
    console.log(`\nExisting rows on event ${EVENT_ID}:`);
    for (const r of existing.rows) console.log(`  ${r.status}: ${r.n}`);

    if (!CONFIRM) {
      console.log(`\nDRY RUN — nothing written. Re-run with --confirm to:`);
      console.log(`  1. back up all event-${EVENT_ID} rows to ${path.relative(process.cwd(), BACKUP_DIR)}/`);
      console.log(`  2. DELETE the ${existing.rows.find((r) => r.status === "active")?.n ?? 0} 'active' rows`);
      console.log(`  3. INSERT ${records.length} rows with status 'pending'`);
      return;
    }

    // ---- 1. backup ---------------------------------------------------------
    const all = await pool.query(`SELECT * FROM find_event_exhibitor WHERE event_id = $1`, [EVENT_ID]);
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const backupPath = path.join(BACKUP_DIR, `find_event_exhibitor-event${EVENT_ID}-backup.json`);
    fs.writeFileSync(backupPath, JSON.stringify(all.rows, null, 2));
    console.log(`\n  backed up ${all.rowCount} row(s) -> ${path.relative(process.cwd(), backupPath)}`);

    // ---- 2. delete the stale active batch ---------------------------------
    const del = await pool.query(
      `DELETE FROM find_event_exhibitor WHERE event_id = $1 AND status = 'active'`,
      [EVENT_ID]
    );
    console.log(`  deleted ${del.rowCount} 'active' row(s)`);

    // ---- 3. insert the sheet ---------------------------------------------
    let inserted = 0;
    for (const r of records) {
      await pool.query(
        `INSERT INTO find_event_exhibitor
           (event_id, business, name, first_name, last_name, email, phone, website,
            status, date, batch_number, listing_id, user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',NOW(),$9,0,0)`,
        [EVENT_ID, r.business, r.name, r.first_name, r.last_name, r.email, r.phone, r.website, r.source.slice(0, 50)]
      );
      inserted++;
    }
    console.log(`  inserted ${inserted} row(s) as 'pending'`);

    const after = await pool.query(
      `SELECT status, COUNT(*)::int AS n FROM find_event_exhibitor WHERE event_id = $1 GROUP BY status`,
      [EVENT_ID]
    );
    console.log(`\nEvent ${EVENT_ID} now:`);
    for (const row of after.rows) console.log(`  ${row.status}: ${row.n}`);
    console.log(`\nThe public /exhibitors page shows 'active' only — approve rows in the CP to publish them.`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Import failed:", e.message);
  process.exit(1);
});
