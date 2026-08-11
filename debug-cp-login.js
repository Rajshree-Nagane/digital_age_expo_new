#!/usr/bin/env node
/**
 * Diagnoses "CP login fails even with the right password" by walking the exact same checks
 * src/lib/cp/auth/authRepository.ts's verifyCpCredentials() does, against your real Neon
 * database, and printing WHICH step fails instead of the generic error the login page shows
 * on purpose (it can't reveal whether an account exists, is disabled, or lacks admin rights).
 *
 * PREREQUISITE: npm install   (this app already depends on `pg`; dotenv is already a devDependency)
 * RUN (from the project root, credentials never leave your machine):
 *   node debug-cp-login.js "your-login-or-email" "your-password"
 */
require("dotenv").config();
const { Client } = require("pg");
const { createHash } = require("crypto");

const DOMAIN_ID = 150; // src/lib/site-config.ts
const ADMIN_LOGIN_PERMISSION = "admin_login";

const [, , identifier, password] = process.argv;
if (!identifier || !password) {
  console.error('Usage: node debug-cp-login.js "your-login-or-email" "your-password"');
  process.exit(1);
}

const SUPPORTED_ALGOS = new Set(["md5", "sha1", "sha256"]);
function resolveAlgo(algo) {
  if (algo === "sha2") return "sha256";
  return SUPPORTED_ALGOS.has(algo) ? algo : "md5";
}
function hashPassword(plainPassword, salt, algo = "sha256") {
  return createHash(resolveAlgo(algo)).update(plainPassword + salt).digest("hex");
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Step 1: does the account exist at all, under ANY domain_id?
  const anyDomain = await client.query(
    `SELECT id, login, user_email, domain_id, user_status FROM find_users WHERE login = $1 OR user_email = $1`,
    [identifier]
  );
  if (anyDomain.rows.length === 0) {
    console.log(`STEP 1 FAILED: no find_users row has login or user_email = "${identifier}" at all.`);
    console.log("-> Either the account never existed, the identifier is misspelled, or that row didn't make it over in the MySQL->Postgres migration. Check find_users in your local MySQL for this login/email.");
    await client.end();
    return;
  }
  console.log(`STEP 1 OK: found ${anyDomain.rows.length} row(s) with that login/email:`);
  console.table(anyDomain.rows.map((r) => ({ id: r.id, login: r.login, email: r.user_email, domain_id: r.domain_id, user_status: r.user_status })));

  const wrongDomain = anyDomain.rows.filter((r) => r.domain_id !== DOMAIN_ID);
  if (wrongDomain.length && !anyDomain.rows.some((r) => r.domain_id === DOMAIN_ID)) {
    console.log(`\nSTEP 1b FAILED: the row(s) above have domain_id != ${DOMAIN_ID} (the hardcoded site domain in src/lib/site-config.ts). The login query filters on domain_id = ${DOMAIN_ID}, so this account is invisible to CP login regardless of password.`);
    await client.end();
    return;
  }

  // Step 2: full lookup exactly as verifyCpCredentials does
  const userRes = await client.query(
    `SELECT id, login, pass, password_salt, password_hash, user_email, user_first_name, user_last_name, user_status
     FROM find_users WHERE domain_id = $1 AND (login = $2 OR user_email = $2)`,
    [DOMAIN_ID, identifier]
  );
  const user = userRes.rows[0];
  console.log(`\nSTEP 2: user_status = "${user.user_status}" (must be exactly "active")`);
  if (user.user_status !== "active") {
    console.log("STEP 2 FAILED: user_status is not \"active\" — this alone makes verifyCpCredentials() return null regardless of password. If this looks wrong (e.g. it should say \"active\" but shows something else or blank), it may have been altered by the enum-coercion step during migration, or it was already this way in the source MySQL data.");
    await client.end();
    return;
  }
  console.log("STEP 2 OK");

  // Step 3: password check
  const computed = hashPassword(password, user.password_salt, user.password_hash);
  const passwordOk = computed === user.pass;
  console.log(`\nSTEP 3: password hash match = ${passwordOk}`);
  if (!passwordOk) {
    console.log(`STEP 3 FAILED: the password you gave doesn't hash to the stored value using algo="${user.password_hash}" and the stored salt. Double check you're using the same password this account uses on the member portal (CP login reuses find_users, not a separate credential) — or the salt/hash/algo columns didn't migrate correctly.`);
    await client.end();
    return;
  }
  console.log("STEP 3 OK");

  // Step 4: group membership
  const groupLookups = await client.query(`SELECT group_id FROM find_users_groups_lookup WHERE user_id = $1`, [user.id]);
  console.log(`\nSTEP 4: group memberships found = ${groupLookups.rows.length}`);
  if (groupLookups.rows.length === 0) {
    console.log("STEP 4 FAILED: this account isn't in ANY group (find_users_groups_lookup has no row for this user id). No groups means no permissions means no admin_login, so CP login always fails for this account until an admin adds it to a group.");
    await client.end();
    return;
  }
  const groupIds = groupLookups.rows.map((r) => r.group_id);
  console.log("group_ids:", groupIds);

  const groups = await client.query(`SELECT id, name, administrator FROM find_users_groups WHERE id = ANY($1)`, [groupIds]);
  console.log(`STEP 4b: matching find_users_groups rows = ${groups.rows.length}`);
  console.table(groups.rows);

  // Step 5: permissions
  const permLookups = await client.query(
    `SELECT DISTINCT permission_id FROM find_users_groups_permissions_lookup WHERE group_id = ANY($1)`,
    [groupIds]
  );
  const permissionIds = permLookups.rows.map((r) => r.permission_id);
  console.log(`\nSTEP 5: distinct permission ids granted to these groups = ${permissionIds.length}`);
  console.log(permissionIds);

  if (!permissionIds.includes(ADMIN_LOGIN_PERMISSION)) {
    console.log(`\nSTEP 5 FAILED: none of this account's groups grant the "${ADMIN_LOGIN_PERMISSION}" permission — that's the master switch that gates CP access. Everything else checks out (password is correct!), but without this permission on at least one group, verifyCpCredentials() returns null.`);
    // Sanity-check whether admin_login exists as a concept in this DB at all.
    const permExists = await client.query(`SELECT * FROM find_users_permissions WHERE id = $1`, [ADMIN_LOGIN_PERMISSION]).catch(() => ({ rows: [] }));
    console.log(`(Does "${ADMIN_LOGIN_PERMISSION}" exist at all in find_users_permissions? ${permExists.rows.length > 0 ? "yes" : "no — check the exact column/value name in find_users_permissions"})`);
    await client.end();
    return;
  }

  console.log(`\nALL STEPS PASSED — this account should be able to log into /cp. If it still fails in the browser, the issue is elsewhere (e.g. stale session cookie, or a bug outside verifyCpCredentials).`);
  await client.end();
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err.message);
  process.exit(1);
});
