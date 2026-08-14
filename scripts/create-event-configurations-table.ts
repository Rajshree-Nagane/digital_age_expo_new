/**
 * ===========================================================================
 *  CREATE find_event_configurations
 * ===========================================================================
 *
 *  Backs the "Register / Login Design" screen
 *  (src/app/members/(event)/event_configurations/page.tsx), which stores where
 *  the organiser dragged the register/login form over the event's registration
 *  background, plus that form's text and border colours.
 *
 *  Like find_event_registration_fields, this table exists in the legacy MySQL
 *  install but was not carried across to Neon/Postgres, so without this you get:
 *
 *      42P01  relation "find_event_configurations" does not exist
 *
 *  Run once:
 *
 *      npm run db:event-configurations
 *      npx tsx scripts/create-event-configurations-table.ts --dry-run
 *
 *  SAFE TO RE-RUN — creates only what is missing, never drops or alters, and
 *  never touches existing rows.
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => a.slice(2)));
const DRY_RUN = flags.has("dry-run");

try {
  const dotenv = require("dotenv");
  dotenv.config({ path: path.join(ROOT, ".env") });
  dotenv.config({ path: path.join(ROOT, ".env.local"), override: false });
} catch {
  console.warn("! dotenv unavailable — relying on the ambient environment");
}

const TABLE = "find_event_configurations";

/**
 * Exactly the columns the legacy event_configurations.php + .tpl read and write.
 *
 * Positions are percentages of the background's width/height (the legacy JS
 * computed `item_left * 100 / screen_width`), so DOUBLE PRECISION rather than
 * an integer — a whole-number percent is too coarse to place a form accurately.
 */
const COLUMNS: { name: string; ddl: string }[] = [
  { name: "event_id", ddl: "INTEGER NOT NULL" },
  { name: "register_page_text_color", ddl: "VARCHAR(32)" },
  { name: "register_page_border_color", ddl: "VARCHAR(32)" },
  { name: "register_form_x_position", ddl: "DOUBLE PRECISION NOT NULL DEFAULT 30" },
  { name: "register_form_y_position", ddl: "DOUBLE PRECISION NOT NULL DEFAULT 25" },
  { name: "login_form_x_position", ddl: "DOUBLE PRECISION NOT NULL DEFAULT 30" },
  { name: "login_form_y_position", ddl: "DOUBLE PRECISION NOT NULL DEFAULT 25" },
];

async function main() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error("No DATABASE_URL / POSTGRES_URL found in .env — nothing to connect to.");
    process.exit(1);
  }

  const { Client } = require("pg");
  const client = new Client({ connectionString, connectionTimeoutMillis: 20_000 });

  console.log("=".repeat(70));
  console.log(` ${TABLE}${DRY_RUN ? "   [DRY RUN — nothing will be written]" : ""}`);
  console.log("=".repeat(70));

  await client.connect();

  try {
    const { rows } = await client.query(`SELECT to_regclass($1) AS oid`, [`public.${TABLE}`]);
    const tableExists = rows[0]?.oid !== null;
    console.log(`\n  table exists : ${tableExists ? "yes" : "NO — will be created"}`);

    if (DRY_RUN) {
      console.log("\n  Dry run: re-run without --dry-run to apply.");
      return;
    }

    if (!tableExists) {
      const body = COLUMNS.map((c) => `  "${c.name}" ${c.ddl}`).join(",\n");
      await client.query(
        `CREATE TABLE IF NOT EXISTS "${TABLE}" (\n  "id" SERIAL PRIMARY KEY,\n${body}\n)`,
      );
      console.log(`  + created table "${TABLE}"`);
    }

    const { rows: cols } = await client.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1`,
      [TABLE],
    );
    const present = new Set(cols.map((c: any) => c.column_name));
    for (const column of COLUMNS) {
      if (!present.has(column.name)) {
        await client.query(`ALTER TABLE "${TABLE}" ADD COLUMN "${column.name}" ${column.ddl}`);
        console.log(`  + added missing column "${column.name}"`);
      }
    }

    /*
     * One row per event: the legacy upsertConfigurations() updated-or-inserted
     * keyed on event_id, which is only safe with a uniqueness guarantee. Without
     * it a double submit silently creates a second row and the screen starts
     * reading whichever the planner returns first.
     */
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "${TABLE}_event_id_key" ON "${TABLE}" ("event_id")`,
    );
    console.log(`  = unique index on event_id ensured (one config row per event)`);

    const { rows: summary } = await client.query(`SELECT COUNT(*)::int AS count FROM "${TABLE}"`);
    console.log(`\n  rows: ${summary[0]?.count ?? 0}`);
    console.log("\n  Done. Open /members/event_configurations?event_id=<id> — a row is created");
    console.log("  for an event the first time you save a form position.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("\nFATAL:", e?.message ?? e);
  process.exit(1);
});
