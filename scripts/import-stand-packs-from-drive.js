#!/usr/bin/env node
/**
 * ===========================================================================
 *  ONE-OFF IMPORT: exhibitor stand banner packs (Google Drive) -> stand slots
 * ===========================================================================
 *
 *  The stand artwork was produced outside the app, as one Drive folder per
 *  exhibitor containing a 7-panel banner pack plus a README.md documenting the
 *  intended placement of each panel. This loads those panels into the same
 *  records the in-app editor writes, so an imported stand is indistinguishable
 *  from one an exhibitor uploaded themselves.
 *
 *  WHERE THE PANELS GO
 *
 *  STAND_TEMPLATE_SLOTS (src/lib/standTemplateSlots.ts) are six boxes measured
 *  off the pixels of the fallback background /images/stand_img.png. They are the
 *  right target here precisely because these exhibitors have no
 *  stand_image_url, stand_color_id or ex_stand_layout_id — so that fallback IS
 *  the background being rendered, which is the only condition under which those
 *  coordinates mean anything.
 *
 *  Five of the seven panels map by exact dimensions (pack -> app):
 *
 *      01-top-banner.png    680x190  ->  top_banner          678x188
 *      03-stand-logo.png    235x95   ->  tabletop_banner     232x94
 *      04-top-left.png      330x400  ->  top_banner_left     325x395
 *      05-top-right.png     330x400  ->  top_banner_right    325x395
 *      06-bottom-left.png   340x730  ->  bottom_banner_left  335x727
 *
 *  The other two are deliberately SKIPPED rather than forced:
 *    - 02-table-banner.png (685x190) has no corresponding slot at all.
 *    - 07-bottom-right.png is 200x240, but bottom_banner_right is 335x727 —
 *      a 3x aspect-ratio difference, so it would render visibly distorted or
 *      letterboxed. Better absent than wrong.
 *
 *  MATCHING FOLDER -> EXHIBITOR
 *
 *  Not by folder name — those are abbreviated slugs and matching them fuzzily
 *  produced obvious errors (it paired "k-os-visuals" with "Hollow Rocks"). Each
 *  README's H1 carries the real company name, so that is the key, normalised
 *  against find_event_exhibitor.business. NAME_OVERRIDES holds the handful the
 *  operator confirmed by hand where the two spellings genuinely differ.
 *
 *  USAGE
 *      node scripts/import-stand-packs-from-drive.js            # dry run
 *      node scripts/import-stand-packs-from-drive.js --confirm  # writes
 *
 *  Re-runnable: each slot is replaced, never accumulated, exactly as the
 *  editor's update_template_asset action does.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const ROOT_FOLDER_ID = process.env.STAND_PACK_FOLDER_ID || "1bNFbp6VQFTE737GmzKxDok3JxAc2WvmJ";
const EVENT_ID = 1474;
const CONFIRM = process.argv.includes("--confirm");
const UPLOAD_DIR = path.join(__dirname, "..", "public", "images", "lobby_assets");

/** Pack filename -> STAND_TEMPLATE_SLOTS key. Only the five that match by dimension. */
const PANEL_TO_SLOT = {
  "01-top-banner": "top_banner",
  "03-stand-logo": "tabletop_banner",
  "04-top-left": "top_banner_left",
  "05-top-right": "top_banner_right",
  "06-bottom-left": "bottom_banner_left",
};

/**
 * README company name -> find_event_exhibitor.business, for the cases where
 * normalisation alone does not connect them. Confirmed by the operator; a wrong
 * entry here puts one company's artwork on another company's stand, so nothing
 * goes in without being checked.
 */
const NAME_OVERRIDES = {
  "abdominal brain": "Abdominal (Primary) Brain Ltd",
  "efa emotional first aid": "Emotional First Aid Limited",
  "impact a&c milton keynes": "Impact Academy Milton Keynes",
  skillsassess: "Skill Assess",
  "green gorilla software": "Green Gorilla Apps",
  "levy uk + ireland": "Levy",
};

/** No find_event_exhibitor row exists for these, so there is nothing to attach artwork to. */
const NO_EXHIBITOR = new Set(["kn comms"]);

const PG_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!PG_URL) {
  console.error("DATABASE_URL is not set. Aborting.");
  process.exit(1);
}

const ENTRY_RE = /id="entry-([^"]+)"[\s\S]*?flip-entry-title">([^<]+)</g;
const REAL_PANEL = /^0[1-7]-[a-z-]+\.(png|jpg|jpeg)$/i;

/** Public Drive folders render a server-side list at this endpoint — no API key needed. */
async function listFolder(id) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}#list`);
  if (!res.ok) throw new Error(`folder ${id}: HTTP ${res.status}`);
  const html = await res.text();
  const out = [];
  let m;
  ENTRY_RE.lastIndex = 0;
  while ((m = ENTRY_RE.exec(html))) out.push({ id: m[1], name: m[2] });
  return out;
}

async function downloadFile(id) {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${id}`);
  if (!res.ok) throw new Error(`file ${id}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(ltd|limited|llp|plc|the|for|of)\b/g, "")
    .replace(/[^a-z0-9]/g, "");

async function main() {
  console.log(`Listing stand packs in Drive folder ${ROOT_FOLDER_ID}...`);
  const folders = await listFolder(ROOT_FOLDER_ID);
  console.log(`  ${folders.length} folder(s)`);

  const packs = [];
  for (const f of folders) {
    const entries = await listFolder(f.id);
    let panels = entries.filter((e) => REAL_PANEL.test(e.name));
    // Some packs nest the panels one level down in a png/ subfolder.
    if (!panels.length) {
      const pngDir = entries.find((e) => e.name === "png");
      if (pngDir) panels = (await listFolder(pngDir.id)).filter((e) => REAL_PANEL.test(e.name));
    }
    if (!panels.length) {
      console.log(`  ${f.name}: SKIPPED — no numbered panels (only ${entries.map((e) => e.name).join(", ")})`);
      continue;
    }
    const readme = entries.find((e) => e.name === "README.md");
    let company = "";
    if (readme) {
      const text = (await downloadFile(readme.id)).toString("utf8");
      const h1 = text.match(/^#\s+(.+)$/m);
      if (h1) company = h1[1].replace(/\s*[—-]\s*DAE.*$/i, "").trim();
    }
    if (!company) {
      console.log(`  ${f.name}: SKIPPED — no company name in README, cannot match safely`);
      continue;
    }
    packs.push({ folder: f.name, company, panels });
  }
  console.log(`\n  ${packs.length} pack(s) with panels and a company name`);

  const pool = new Pool({ connectionString: PG_URL });
  try {
    const { rows: exhibitors } = await pool.query(
      `SELECT id, business FROM find_event_exhibitor WHERE event_id = $1`,
      [EVENT_ID]
    );
    const byNorm = new Map();
    for (const e of exhibitors) {
      const k = norm(e.business);
      if (k && !byNorm.has(k)) byNorm.set(k, e);
    }

    const plan = [];
    const unmatched = [];
    const seenExhibitor = new Set();
    for (const p of packs) {
      const lower = p.company.toLowerCase();
      if (NO_EXHIBITOR.has(lower)) {
        unmatched.push(`${p.company} (no exhibitor record)`);
        continue;
      }
      const target = NAME_OVERRIDES[lower] ?? p.company;
      const match = byNorm.get(norm(target));
      if (!match) {
        unmatched.push(p.company);
        continue;
      }
      if (seenExhibitor.has(match.id)) {
        console.log(`  duplicate pack for "${match.business}" — using the first, ignoring ${p.folder}`);
        continue;
      }
      seenExhibitor.add(match.id);
      plan.push({ ...p, exhibitorId: match.id, business: match.business });
    }

    console.log(`\nMatched ${plan.length} exhibitor(s); ${unmatched.length} pack(s) unmatched`);
    for (const u of unmatched) console.log(`  unmatched: ${u}`);

    const slotCount = Object.keys(PANEL_TO_SLOT).length;
    if (!CONFIRM) {
      console.log(`\nDRY RUN — nothing written. Would install ${slotCount} slot(s) for each of ${plan.length} exhibitor(s):`);
      for (const p of plan.slice(0, 8)) console.log(`  ${p.business} (id ${p.exhibitorId}) <- ${p.folder}`);
      if (plan.length > 8) console.log(`  ... and ${plan.length - 8} more`);
      console.log(`\nRe-run with --confirm to download ${plan.length * slotCount} panel(s) and write the records.`);
      return;
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    let installed = 0;
    let bytes = 0;
    const failures = [];

    for (const p of plan) {
      let perExhibitor = 0;
      for (const panel of p.panels) {
        const stem = panel.name.replace(/\.(png|jpg|jpeg)$/i, "").toLowerCase();
        const slotKey = PANEL_TO_SLOT[stem];
        if (!slotKey) continue; // 02-table-banner / 07-bottom-right — see header

        try {
          // Upsert the slot's asset row, mirroring update_template_asset in
          // /api/members/stand-assets/route.ts so the editor sees its own shape.
          const existing = await pool.query(
            `SELECT id FROM find_event_lobby_layout_type_assets
              WHERE exhibition_stand_id = $1 AND event_id = $2 AND title = $3 LIMIT 1`,
            [p.exhibitorId, EVENT_ID, slotKey]
          );
          let assetId = existing.rows[0]?.id;
          if (!assetId) {
            const created = await pool.query(
              `INSERT INTO find_event_lobby_layout_type_assets
                 (title, exhibition_stand_id, event_id, asset_type, asset_attachment,
                  extension, agenda_id, layout_type_setup_id, is_exhibitor_asset)
               VALUES ($1,$2,$3,'template_slot','','',0,0,true) RETURNING id`,
              [slotKey, p.exhibitorId, EVENT_ID]
            );
            assetId = created.rows[0].id;
          }

          const buf = await downloadFile(panel.id);
          const safe = panel.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const filename = `event_${assetId}_${Date.now()}_0_${safe}`;
          fs.writeFileSync(path.join(UPLOAD_DIR, filename), buf);
          bytes += buf.length;

          // One image per slot — replace rather than accumulate.
          await pool.query(`DELETE FROM find_event_lobby_asset_gallery WHERE parent_asset_id = $1`, [assetId]);
          await pool.query(
            `INSERT INTO find_event_lobby_asset_gallery (parent_asset_id, asset_url) VALUES ($1,$2)`,
            [assetId, filename]
          );
          await pool.query(
            `UPDATE find_event_lobby_layout_type_assets
                SET asset_attachment = $1, extension = $2 WHERE id = $3`,
            [filename, (panel.name.split(".").pop() || "").slice(0, 11), assetId]
          );
          installed++;
          perExhibitor++;
        } catch (err) {
          failures.push(`${p.business} / ${slotKey}: ${err.message}`);
        }
      }
      console.log(`  ${p.business.padEnd(38)} ${perExhibitor}/${slotCount} slot(s)`);
    }

    console.log(`\nInstalled ${installed} slot image(s) across ${plan.length} exhibitor(s), ${(bytes / 1048576).toFixed(1)} MB written`);
    if (failures.length) {
      console.log(`${failures.length} failure(s):`);
      for (const f of failures) console.log(`  ${f}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Import failed:", e.message);
  process.exit(1);
});
