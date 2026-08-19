#!/usr/bin/env bash
#
# ===========================================================================
#  ONE-OFF MIGRATION: Neon  ->  Prisma Postgres
# ===========================================================================
#
#  Copies the legacy `find_*` database out of Neon and into Prisma Postgres,
#  then leaves you with a dump file on disk as a safety net.
#
#  WHY THIS EXISTS
#
#  The Neon project ran past its Free-plan data-transfer allowance. Once that
#  happens Neon refuses connections outright:
#
#      psql: error: ... ERROR:  Your project has exceeded the data transfer
#      quota. Upgrade your plan to increase limits.
#
#  Both the pooled and the direct (unpooled) endpoint refuse — the limit is
#  enforced per project, not per endpoint — so `pg_dump` cannot read anything
#  while the project is blocked. Per Neon's own FAQ, compute is suspended
#  "until the next billing period or until you upgrade", so this script can
#  only run once one of those two has happened.
#
#  BEFORE RUNNING
#
#    1. Unblock Neon (upgrade the plan, or wait for the quota period to reset).
#    2. Put both connection strings in the environment or in .env:
#         NEON_DUMP_URL   the Neon UNPOOLED/direct string (no "-pooler" in the
#                         host). pg_dump does a long single session, which is
#                         what a direct connection is for; pgbouncer can drop
#                         it mid-dump.
#         DATABASE_URL    the Prisma Postgres string (db.prisma.io).
#    3. Have psql/pg_dump 17+ available. Older clients can fail against a
#       newer server with a version-mismatch error.
#
#  USAGE
#      bash scripts/migrate-neon-to-prisma-postgres.sh
#
#  It is safe to re-run: the restore step recreates objects from scratch, so a
#  half-finished attempt does not leave you stuck. It is NOT safe to run
#  against a Prisma Postgres database that already holds data you want — see
#  the confirmation prompt below.
#
set -euo pipefail

DUMP_DIR="${DUMP_DIR:-./database}"
DUMP_FILE="$DUMP_DIR/neon-dump.sql"

die() { echo "ERROR: $*" >&2; exit 1; }

# --- load .env if the vars are not already in the environment ---------------
if [[ -f .env ]] && { [[ -z "${NEON_DUMP_URL:-}" ]] || [[ -z "${DATABASE_URL:-}" ]]; }; then
  # shellcheck disable=SC2046
  set -a; source <(grep -E '^(NEON_DUMP_URL|DATABASE_URL)=' .env | sed 's/\r$//'); set +a
fi

[[ -n "${NEON_DUMP_URL:-}" ]] || die "NEON_DUMP_URL is not set (Neon direct/unpooled string)."
[[ -n "${DATABASE_URL:-}"  ]] || die "DATABASE_URL is not set (Prisma Postgres string)."

if [[ "$NEON_DUMP_URL" == *"-pooler."* ]]; then
  echo "WARNING: NEON_DUMP_URL points at the POOLED endpoint. pg_dump is more reliable"
  echo "         against the direct endpoint (drop '-pooler' from the hostname)."
fi

command -v pg_dump >/dev/null || die "pg_dump not found on PATH."
command -v psql    >/dev/null || die "psql not found on PATH."

echo "==> client versions"
pg_dump --version
psql --version

# --- step 1: can we even reach Neon? ---------------------------------------
echo
echo "==> checking Neon is reachable"
if ! psql "$NEON_DUMP_URL" -Atc 'select 1' >/dev/null 2>neon-check.err; then
  echo "--- Neon refused the connection: ---"
  cat neon-check.err >&2
  rm -f neon-check.err
  die "Neon is not accepting connections. If this is the data-transfer quota, the project must be
       upgraded or the quota period must reset before any data can be copied out."
fi
rm -f neon-check.err
echo "    Neon OK"

# --- step 2: what are we about to overwrite? -------------------------------
echo
echo "==> checking the Prisma Postgres target"
TARGET_TABLES=$(psql "$DATABASE_URL" -Atc \
  "select count(*) from information_schema.tables where table_schema='public'")
TARGET_ROWS=$(psql "$DATABASE_URL" -Atc \
  "select coalesce(sum(n_live_tup),0) from pg_stat_user_tables" 2>/dev/null || echo 0)
echo "    target currently has $TARGET_TABLES tables, ~$TARGET_ROWS rows"

if [[ "${TARGET_ROWS:-0}" -gt 0 ]]; then
  echo
  echo "The target database already contains data. This migration DROPS and recreates"
  echo "every object in the public schema, which destroys it."
  read -r -p "Type 'overwrite' to continue: " confirm
  [[ "$confirm" == "overwrite" ]] || die "Aborted — nothing was changed."
fi

# --- step 3: dump ----------------------------------------------------------
echo
echo "==> dumping Neon to $DUMP_FILE"
mkdir -p "$DUMP_DIR"
# --no-owner / --no-privileges: the Neon role (neondb_owner) does not exist on the target, and
#   GRANT/OWNER TO statements referencing it would fail the restore for no benefit.
# --no-comments: avoids COMMENT ON statements that need ownership of the object.
# --quote-all-identifiers: this schema has an uppercase column ("DOMAIN" in find_settings) that
#   only round-trips correctly when quoted.
pg_dump "$NEON_DUMP_URL" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --no-comments \
  --quote-all-identifiers \
  --file="$DUMP_FILE"

DUMP_SIZE=$(wc -c < "$DUMP_FILE")
echo "    wrote $DUMP_SIZE bytes"
[[ "$DUMP_SIZE" -gt 1000 ]] || die "Dump looks empty — stopping before touching the target."

# --- step 4: restore -------------------------------------------------------
echo
echo "==> restoring into Prisma Postgres"
# The schema was created earlier with `prisma db push`, so drop it first: restoring CREATE TABLE
# over existing tables would otherwise fail on every object.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction --file="$DUMP_FILE"

# --- step 5: verify --------------------------------------------------------
echo
echo "==> verifying"
for q in \
  "select count(*) from information_schema.tables where table_schema='public'" \
  "select count(*) from find_events" \
  "select count(*) from find_speakers" \
  "select count(*) from find_event_exhibitor" \
  "select count(*) from find_domains" \
  "select count(*) from find_settings"
do
  printf '    %-70s ' "$q"
  psql "$DATABASE_URL" -Atc "$q" 2>&1 | head -1
done

cat <<'DONE'

==> done

Next steps:
  1. npm run db:ping                     confirm the app's own connection path works
  2. npx prisma db push                  reconcile the schema with prisma/schema.prisma
                                         (expect "already in sync" — investigate if not)
  3. npm run dev                         check pages render real data locally
  4. Update DATABASE_URL in the Vercel project, then redeploy.
  5. Keep the dump file until production has been verified, then delete it —
     it contains the full database in plain text. .gitignore already excludes
     /database/*.sql so it will not be committed.
DONE
