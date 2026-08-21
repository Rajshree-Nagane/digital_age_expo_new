#!/usr/bin/env node
/**
 * ===========================================================================
 *  LINK EXHIBITOR RECORDS TO USER ACCOUNTS
 * ===========================================================================
 *
 *  WHY
 *
 *  "View My Booth" resolves the signed-in user's own booth via
 *  find_event_exhibitor.user_id (findExhibitorForUser in
 *  src/app/members/(event)/event_lobby_layout_manager/page.tsx). 193 of the 232
 *  exhibitor rows on this event carry user_id = 0 — the 186 imported from the
 *  onboarding sheet plus the 7 created from stand packs — because logins were
 *  deliberately not created at import time: the sheet was world-readable and
 *  carried a plaintext password in every row, so those credentials had to be
 *  treated as compromised rather than loaded.
 *
 *  The consequence is that no exhibitor can reach their own booth, however
 *  complete its artwork is. This links them.
 *
 *  THREE CASES, HANDLED DIFFERENTLY
 *
 *    already a user   The exhibitor's email already exists in find_users (44 of
 *                     them). LINK to that row. No account is created and no
 *                     password is touched — these people may already have
 *                     working credentials from the legacy system, and resetting
 *                     them would lock them out.
 *
 *    needs an account Create find_users with a freshly generated random password,
 *                     hashed the way the app verifies it: pass =
 *                     sha256(password + salt), password_salt = 16 random bytes,
 *                     password_hash = the ALGORITHM NAME ("sha256") — that column
 *                     stores the algo, not the digest. See src/lib/auth/password.ts.
 *
 *    no email         Skipped and reported. There is no identifier to log in
 *                     with; the stand packs carry no contact details.
 *
 *  PASSWORDS, AND WHY THIS IS NOT FINISHED WHEN THE SCRIPT ENDS
 *
 *  The generated passwords are written to database/exhibitor-logins.csv
 *  (gitignored) because there is NO member password-reset flow in this app — no
 *  forgot-password route, no reset API. An account whose password nobody knows is
 *  unusable and unrecoverable, so the passwords have to be handed over somehow.
 *
 *  That file is a list of live credentials. Distribute it over something better
 *  than email, delete it afterwards, and treat building a proper reset flow as
 *  the actual fix — this is a bridge, not a destination.
 *
 *  The sheet's own plaintext passwords are deliberately NOT reused. They were
 *  publicly readable.
 *
 *  USAGE
 *      node scripts/link-exhibitors-to-logins.js            # dry run
 *      node scripts/link-exhibitors-to-logins.js --confirm  # writes
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Pool } = require("pg");

const EVENT_ID = Number(process.env.EVENT_ID || 1474);
const CONFIRM = process.argv.includes("--confirm");
const OUT_DIR = path.join(__dirname, "..", "database");
const OUT_FILE = path.join(OUT_DIR, "exhibitor-logins.csv");

const PG_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!PG_URL) {
  console.error("DATABASE_URL is not set. Aborting.");
  process.exit(1);
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Mirrors src/lib/auth/password.ts exactly — the app must be able to verify what we write. */
const generateSalt = () => crypto.randomBytes(16).toString("hex");
const hashPassword = (plain, salt) => crypto.createHash("sha256").update(plain + salt).digest("hex");

/**
 * A readable but unguessable password. Ambiguous characters (O/0, l/1, I) are left out because
 * these get read off a screen and typed by hand.
 */
function generatePassword() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(16);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/**
 * find_users has 27 NOT NULL columns with no default — bank details, `custom_*` fields, franchise
 * bookkeeping. Rather than hardcode that list (and silently break when the schema shifts), read it
 * and fill each with a type-appropriate blank.
 */
async function buildRequiredDefaults(pool) {
  const { rows } = await pool.query(
    `SELECT column_name, data_type
       FROM information_schema.columns
      WHERE table_name = 'find_users' AND is_nullable = 'NO' AND column_default IS NULL`
  );
  const defaults = {};
  for (const r of rows) {
    const t = r.data_type;
    if (t.includes("char") || t === "text") defaults[r.column_name] = "";
    else if (t.includes("int") || t === "numeric" || t.includes("double")) defaults[r.column_name] = 0;
    else if (t === "date") defaults[r.column_name] = "1970-01-01";
    else if (t.includes("timestamp")) defaults[r.column_name] = "1970-01-01 00:00:00";
    else if (t === "boolean") defaults[r.column_name] = false;
    else defaults[r.column_name] = "";
  }
  return defaults;
}

async function main() {
  const pool = new Pool({ connectionString: PG_URL });
  try {
    const { rows: exhibitors } = await pool.query(
      `SELECT id, business, email, name, first_name, last_name
         FROM find_event_exhibitor
        WHERE event_id = $1 AND COALESCE(user_id, 0) = 0
        ORDER BY id`,
      [EVENT_ID]
    );
    console.log(`Event ${EVENT_ID}: ${exhibitors.length} exhibitor row(s) with no linked user`);

    const toLink = [];
    const toCreate = [];
    const noEmail = [];
    const seenEmail = new Map();

    for (const e of exhibitors) {
      const email = String(e.email ?? "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        noEmail.push(e.business || `#${e.id}`);
        continue;
      }

      // Two exhibitor rows can legitimately share a contact email (the sheet had three such
      // companies). They must resolve to ONE account, not two competing ones.
      if (seenEmail.has(email)) {
        toLink.push({ ...e, email, existingUserId: null, sharesWith: seenEmail.get(email) });
        continue;
      }
      seenEmail.set(email, e.business);

      const { rows: found } = await pool.query(
        `SELECT id FROM find_users WHERE lower(login) = $1 OR lower(user_email) = $1 LIMIT 1`,
        [email]
      );
      if (found[0]) toLink.push({ ...e, email, existingUserId: found[0].id });
      else toCreate.push({ ...e, email });
    }

    console.log(`  ${toLink.filter((r) => r.existingUserId).length} already have a find_users account -> link only`);
    console.log(`  ${toLink.filter((r) => !r.existingUserId).length} share an email with another row -> link to the same account`);
    console.log(`  ${toCreate.length} need a new account`);
    console.log(`  ${noEmail.length} have no usable email -> skipped`);
    if (noEmail.length) for (const n of noEmail) console.log(`      no email: ${n}`);

    if (!CONFIRM) {
      console.log(`\nDRY RUN — nothing written. Re-run with --confirm to:`);
      console.log(`  link ${toLink.length} exhibitor row(s) to existing accounts`);
      console.log(`  create ${toCreate.length} account(s) and write their passwords to`);
      console.log(`    ${path.relative(process.cwd(), OUT_FILE)}  (gitignored)`);
      return;
    }

    const defaults = await buildRequiredDefaults(pool);
    const credentials = [];
    let linked = 0;
    let created = 0;
    const failures = [];

    // Pass 1: rows whose account already exists.
    for (const r of toLink) {
      try {
        let userId = r.existingUserId;
        if (!userId) {
          const { rows } = await pool.query(
            `SELECT id FROM find_users WHERE lower(login) = $1 OR lower(user_email) = $1 LIMIT 1`,
            [r.email]
          );
          userId = rows[0]?.id;
        }
        if (!userId) {
          failures.push(`${r.business}: shared email ${r.email} but no account resolved`);
          continue;
        }
        await pool.query(`UPDATE find_event_exhibitor SET user_id = $1 WHERE id = $2`, [userId, r.id]);
        linked++;
      } catch (err) {
        failures.push(`${r.business}: ${err.message}`);
      }
    }

    // Pass 2: create the missing accounts.
    for (const r of toCreate) {
      try {
        const password = generatePassword();
        const salt = generateSalt();

        const cols = { ...defaults };
        cols.login = r.email;
        cols.user_email = r.email;
        cols.user_first_name = String(r.first_name ?? "").trim() || String(r.name ?? "").trim();
        cols.user_last_name = String(r.last_name ?? "").trim();
        cols.user_status = "active";
        cols.pass = hashPassword(password, salt);
        cols.password_salt = salt;
        cols.password_hash = "sha256"; // the ALGORITHM, not the digest — see password.ts
        // The column is `created` / `joining_date` here, NOT `join_date` — that name exists in the
        // legacy MySQL copy but not in this schema, and assuming it cost 148 failed inserts.
        cols.created = new Date().toISOString();
        cols.joining_date = new Date().toISOString();

        const names = Object.keys(cols);
        const placeholders = names.map((_, i) => `$${i + 1}`).join(", ");
        const { rows } = await pool.query(
          `INSERT INTO find_users (${names.map((n) => `"${n}"`).join(", ")})
           VALUES (${placeholders}) RETURNING id`,
          names.map((n) => cols[n])
        );
        const userId = rows[0].id;

        await pool.query(`UPDATE find_event_exhibitor SET user_id = $1 WHERE id = $2`, [userId, r.id]);
        credentials.push({ business: r.business, email: r.email, password, userId });
        created++;
      } catch (err) {
        failures.push(`${r.business}: ${err.message}`);
      }
    }

    if (credentials.length) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      const header = "business,email,password,user_id\n";
      const body = credentials
        .map((c) => [c.business, c.email, c.password, c.userId].map(csvCell).join(","))
        .join("\n");
      fs.writeFileSync(OUT_FILE, header + body + "\n");
    }

    console.log(`\nLinked ${linked} exhibitor row(s) to existing accounts`);
    console.log(`Created ${created} account(s)`);
    if (credentials.length) {
      console.log(`\nPasswords written to ${path.relative(process.cwd(), OUT_FILE)}`);
      console.log(`  That file contains ${credentials.length} live credential(s). It is gitignored.`);
      console.log(`  Distribute it over something better than email, then delete it.`);
      console.log(`  There is no password-reset flow in this app yet — building one is the real fix.`);
    }
    if (failures.length) {
      console.log(`\n${failures.length} failure(s):`);
      for (const f of failures) console.log(`  ${f}`);
    }

    const { rows: after } = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE COALESCE(user_id,0) = 0) AS unlinked,
              COUNT(*) FILTER (WHERE COALESCE(user_id,0) <> 0) AS linked
         FROM find_event_exhibitor WHERE event_id = $1`,
      [EVENT_ID]
    );
    console.log(`\nEvent ${EVENT_ID} now: ${after[0].linked} linked, ${after[0].unlinked} unlinked`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
