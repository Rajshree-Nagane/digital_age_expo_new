#!/usr/bin/env node
/**
 * One-time safety net: before `prisma db push` drops the pre-existing Event/Exhibitor/
 * Registration/Speaker/Sponsor/Zone tables in Neon (to make room for the new schema), dump
 * whatever is currently in them to a local JSON file. Costs nothing, protects against losing
 * that data if it turns out to matter.
 *
 * PREREQUISITE: npm install   (this app already depends on `pg`)
 * RUN:          node backup-neon-demo-tables.js
 * OUTPUT:       neon-demo-tables-backup.json in the project root
 */
require("dotenv").config(); // plain `node script.js` doesn't auto-load .env the way Next.js does
const { Client } = require("pg");
const fs = require("fs");

const TABLES = ["Event", "Exhibitor", "Registration", "Speaker", "Sponsor", "Zone"];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set — run this from the project root with your .env in place.");
    process.exit(1);
  }
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const backup = {};
  for (const table of TABLES) {
    try {
      const res = await client.query(`SELECT * FROM "${table}"`);
      backup[table] = res.rows;
      console.log(`${table}: backed up ${res.rows.length} rows`);
    } catch (err) {
      console.log(`${table}: skipped (${err.message})`);
      backup[table] = { error: err.message };
    }
  }

  await client.end();

  const outFile = "neon-demo-tables-backup.json";
  fs.writeFileSync(outFile, JSON.stringify(backup, null, 2));
  console.log(`\nSaved to ${outFile} — safe to proceed with "npx prisma db push" now.`);
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
