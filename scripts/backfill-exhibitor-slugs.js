#!/usr/bin/env node
/**
 * Backfills find_event_exhibitor.friendly_url for an event.
 *
 * The public stand viewer resolves an exhibitor by slug and nothing else —
 * getPublicExhibitorStand(friendlyUrl) in src/lib/services/exhibitorStand.ts does
 * `findFirst({ where: { friendly_url } })`. So a row with no slug has no reachable
 * stand page at all, however complete its artwork is.
 *
 * The legacy data mostly left this column empty (6 of 420 rows on event 1474 had
 * one), but those six establish the convention unambiguously: the business name,
 * lowercased, non-alphanumerics collapsed to single hyphens —
 * "The Align 4 Life Team" -> "the-align-4-life-team".
 *
 * There is no unique index on the column, so uniqueness is enforced here instead:
 * a collision gets -2, -3 and so on. Existing non-empty slugs are never touched.
 *
 *     node scripts/backfill-exhibitor-slugs.js            # dry run
 *     node scripts/backfill-exhibitor-slugs.js --confirm  # writes
 */

require("dotenv").config();
const { Pool } = require("pg");

const EVENT_ID = Number(process.env.EVENT_ID || 1474);
const CONFIRM = process.argv.includes("--confirm");

const PG_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!PG_URL) {
  console.error("DATABASE_URL is not set. Aborting.");
  process.exit(1);
}

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  const pool = new Pool({ connectionString: PG_URL });
  try {
    const { rows } = await pool.query(
      `SELECT id, business, friendly_url FROM find_event_exhibitor WHERE event_id = $1 ORDER BY id`,
      [EVENT_ID]
    );

    // Seed the taken set with slugs already in use anywhere, so a backfilled slug
    // cannot collide with another event's exhibitor either.
    const { rows: allSlugs } = await pool.query(
      `SELECT DISTINCT friendly_url FROM find_event_exhibitor WHERE COALESCE(friendly_url,'') <> ''`
    );
    const taken = new Set(allSlugs.map((r) => r.friendly_url));

    const plan = [];
    let skippedNoName = 0;
    for (const r of rows) {
      if (r.friendly_url && r.friendly_url.trim()) continue; // never overwrite
      const base = slugify(r.business);
      if (!base) {
        skippedNoName++;
        continue;
      }
      let slug = base;
      let n = 2;
      while (taken.has(slug)) slug = `${base}-${n++}`;
      taken.add(slug);
      plan.push({ id: r.id, business: r.business, slug });
    }

    console.log(`Event ${EVENT_ID}: ${rows.length} exhibitor(s), ${plan.length} need a slug`);
    if (skippedNoName) console.log(`  ${skippedNoName} skipped — no business name to slug`);
    for (const p of plan.slice(0, 6)) console.log(`  ${p.business.padEnd(38)} -> ${p.slug}`);
    if (plan.length > 6) console.log(`  ... and ${plan.length - 6} more`);

    if (!CONFIRM) {
      console.log(`\nDRY RUN — nothing written. Re-run with --confirm.`);
      return;
    }

    for (const p of plan) {
      await pool.query(`UPDATE find_event_exhibitor SET friendly_url = $1 WHERE id = $2`, [p.slug, p.id]);
    }
    console.log(`\nUpdated ${plan.length} row(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Backfill failed:", e.message);
  process.exit(1);
});
