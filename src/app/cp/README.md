# Admin Control Panel (`/cp`)

## Why this looks different from the first draft

The first pass at this module (see git history / prior session output, if kept) invented 12
brand-new `cp_`-prefixed tables: `cp_roles`, `cp_permissions`, `cp_role_permissions`,
`cp_admin_users`, `cp_password_resets`, `cp_audit_logs`, and six `cp_settings_*` tables.

That draft was replaced after checking the live `connectlocal_website` database against the
**legacy admin CP's own PHP source** (`cp/admin_index.php`, `cp/admin_permissions.php`,
`cp/admin_users.php`, `cp/admin_users_groups.php` in the `findusonweb` reference project).
Ground truth found there: the legacy admin panel has no separate identity/RBAC system of its
own. It authenticates admins against the exact same `find_users` table the member portal
already uses (same `pass`/`password_salt`/`password_hash` columns, same per-user hashing
scheme), and authorizes via a "groups" system that already fully supports configurable,
per-role permissions:

| Legacy table | Role in this CP |
|---|---|
| `find_users` | Identity for both members AND admins — a find_users row IS a potential admin, distinguished only by group membership. Already in `schema.prisma`, already used by the member portal's NextAuth login. |
| `find_users_groups` | A group **is** a role (Super Admin, Admin, Event Manager, ...). |
| `find_users_groups_lookup` | Which user(s) belong to which group(s) — many-to-many. |
| `find_users_permissions` | Catalog of permission slugs (`admin_users_edit`, `admin_login`, ...). |
| `find_users_groups_permissions_lookup` | Which permissions a group grants — this is what "permissions must be configurable" already means in the legacy schema: it's just rows in this table. |
| `find_settings` | DOMAIN-scoped key/value settings, grouped by `grouptitle` — already backs the legacy Project Settings screen (`cp/admin_settings.php`). |
| `find_dashboard_menu` | The legacy admin CP's own sidebar links, role/permission-gated. |
| `find_event_menus` | Backs the new **Member Menu Manager** module. |
| `find_menu_links` | Backs the general site **Menu Manager** (already in `schema.prisma`, already used elsewhere in this app). |

**Only two tables in this module are genuinely new** — things with no legacy or member-portal
equivalent to reuse:

- **`cp_password_resets`** — forgot-password tokens for CP login. No reset-token table or flow
  exists anywhere in this codebase or the legacy schema (checked).
- **`cp_audit_logs`** — structured audit trail. The legacy schema's "logs" tables are all
  feature-specific (`find_email_queue`, etc.) — nothing plays this generic role.

CP login itself reuses `src/lib/auth/password.ts` (`hashPassword`/`verifyPassword`) unchanged —
that file already correctly implements the legacy salted-hash scheme
(`class_authentication.php::verifyPassword()`, per-user algorithm named in the
`password_hash` column) and is already used today to authenticate members via
`verifyMemberCredentials()` in `src/lib/services/member.ts`. An admin and a member log in
through identical verification code against the same column.

## What re-entered `schema.prisma`

An earlier, unrelated cleanup pass (auditing 1372 introspected models for ones the Next.js app
never references) had correctly marked `find_users_groups`, `find_users_groups_lookup`,
`find_users_permissions`, `find_users_groups_permissions_lookup`, `find_settings`,
`find_dashboard_menu`, and `find_event_menus` as unused **at the time** — the Next.js app truly
didn't reference them yet — and pruned them out of `schema.prisma`. That pass only ever edited
the schema file; the underlying MySQL tables in `connectlocal_website` were never touched. This
module adds those seven models back into `schema.prisma` (see the "ADMIN CONTROL PANEL" block
near the end of the file) so Prisma can query tables that already exist in your database.

`find_settings` stays `@@ignore`d (no unique constraint Prisma recognizes on `(varname,
DOMAIN)` — the legacy app enforces that itself in code, not the DB schema) — it's read/written
via `$queryRaw`/`$executeRaw` in `lib/cp/settings/settingsRepository.ts`, mirroring
`admin_settings.php`'s own SELECT/UPDATE/INSERT-if-missing logic exactly.

## Applying the DB change

Two new tables only (`cp_password_resets`, `cp_audit_logs`) — everything else already exists:

```
npx prisma db push
```

This project has never used `prisma migrate` (schema.prisma was built via `db pull` against an
existing database, so there's no migration history to reconcile) — `db push` is the right tool:
it diffs `schema.prisma` against the live database and applies the difference. Since the seven
`find_*` models re-added above already exist with matching shapes, `db push` should report only
the two new `cp_*` tables as needing creation. **If it reports anything else** (a column
mismatch on one of the `find_*` tables), stop and check what it says before proceeding — that
would mean the live table's shape has drifted from what `schema.prisma` now describes.

`prisma/cp_admin_panel_schema.sql` has the equivalent raw `CREATE TABLE` statements if you'd
rather run them by hand (phpMyAdmin, `mysql` CLI, etc.) instead of `db push`.

## Bootstrapping your first Super Admin

```
npx tsx src/app/cp/_scripts/seed.ts you@example.com
```

`you@example.com` (or a username) must already be a `find_users` row on this site's domain —
register it through the normal member sign-up flow first if it doesn't exist yet. The script
does **not** create `find_users` rows itself (that table has dozens of legacy `NOT NULL`
columns with no DB-level defaults; reusing the already-tested registration path is safer than
this script guessing at placeholder values for a table it doesn't own).

Running the script:
- Creates the 8 roles from the spec (`Super Admin`, `Admin`, `Event Manager`, `Content
  Manager`, `Marketing`, `Sales`, `Member Manager`, `Read Only`) as `find_users_groups` rows,
  if they don't already exist by name.
- Creates this CP's permission slug catalog in `find_users_permissions`, if missing.
- Grants each role a starter permission set in `find_users_groups_permissions_lookup` (see
  `ROLE_PERMISSION_GRANTS` in the script) — **fully editable afterward** through User
  Management once that module ships; nothing here is hardcoded at runtime.
- Adds two CP sidebar entries to `find_dashboard_menu` (Dashboard, General Settings) — scoped
  so they don't collide with the legacy PHP panel's ~150+ existing rows in that same table
  (see the comment in `(shell)/layout.tsx` — the sidebar query only reads rows whose `link`
  starts with `/cp`).
- Adds your account to the Super Admin group.

Sign in at `/cp/login` with that account's existing site password — same credentials as the
member portal.

## What's implemented (Phase 1)

- `middleware.ts` — protects every `/cp/**` route except `/cp/login` (previously a no-op with
  an empty matcher, so this can't affect any existing frontend route).
- `lib/cp/auth/session.ts` — signed session cookie (Web Crypto `HMAC-SHA256`, verifiable in
  both Node and Edge runtimes), independent of the member portal's NextAuth session.
- `lib/cp/auth/authRepository.ts` — login verification against `find_users` +
  `find_users_groups*`, requiring the `admin_login` permission slug (mirrors
  `admin_users.php`'s own gate).
- `lib/cp/rbac.ts` — permission slug catalog, the 8 seed roles, `requireCpSession()` /
  `requireCpPermission()` for Server Components/Actions.
- `lib/cp/settings/settingsRepository.ts` — typed `get`/`set`/`define` helpers over
  `find_settings`.
- `(shell)/layout.tsx` + `CpShellNav.tsx` + `CpShellTopbar.tsx` — the dashboard shell: a
  `find_dashboard_menu`-driven sidebar filtered by the signed-in user's permissions, a topbar
  with sign-out.
- `(shell)/settings/general/` — one fully working Project Settings sub-page (fields, page,
  save action) as the concrete pattern for Company/Branding/Theme/SEO/Social to follow.
- `(shell)/users/` + `(shell)/users/groups/` — full User Management: search/paginate
  `find_users`, create/edit accounts, suspend/reactivate, assign roles; and a Roles &
  Permissions screen that edits `find_users_groups` + checks/unchecks exactly which
  permission slugs each role grants (`find_users_groups_permissions_lookup`) — no more
  editing this by re-running the seed script.
- `(shell)/events/` — Event Management: list/search `find_events`, edit its core fields
  (title/description/venue/location/dates/contact), change `status` (free text — this
  project's real status values aren't verifiable from here without live data, so this
  doesn't force a guessed enum), and **Duplicate** (reuses the exact logic behind the
  member portal's own Copy Event button, minus its "must be the organiser" gate). **"Mark
  Active" is bookkeeping only** — every event-scoped page on the live site resolves its
  event through `DEFAULT_EVENT_ID` in `src/lib/site-config.ts`, hardcoded there on purpose
  after a past bug where trusting a DB value drifted the whole site to the wrong event.
  Making this switch actually control the site means deliberately changing `getDomain()`
  to read it — not something this phase does silently (the page says so explicitly).
- `(shell)/menu-manager/` — CRUD over `find_menu_links` (the general site menu: title,
  link, parent for sub-items, order, target, visibility). No drag-and-drop yet — reordering
  is a numeric "Order" field per item.
- `(shell)/member-menu/` — CRUD over `find_event_menus` (the members dashboard's own nav),
  including per-role visibility (visitor/organiser/exhibitor/sponsor/speaker/partner/
  marketer).
- `(shell)/email-templates/` — CRUD over `find_email_templates`, seeded with the 10 named
  templates from the spec. Recipients/from/reply/subject/body/disable/moderate are all
  editable. **`subject`/`body_html` are two brand-new nullable columns** added to this
  existing table (see `prisma/cp_email_templates_columns.sql`) — the legacy email content
  convention lives in a separate phrases table (`find_language_phrases`) via a naming
  scheme this session couldn't verify without live data, so rather than guess at it (and
  risk creating phrase rows nothing real reads), this stores subject/body directly.
  Preview/test-send/version history aren't built yet.
- `_scripts/seed.ts` and `/api/cp/bootstrap` — bootstrap roles, permissions, grants,
  sidebar entries, and your first Super Admin. The API route is the one that's actually
  reliable in this project's dev setup (see the git history / chat log for why the
  standalone `tsx` script isn't) — safe to re-run any time new sidebar items or
  permissions are added.

## Roadmap (later phases, not yet built)

- Project Settings: Company / Branding / Theme / SEO / Social Media sub-pages (same pattern as
  General — new `fields.ts` + `page.tsx` + `actions.ts` per section).
- Drag-and-drop reordering for Menu Manager / Member Menu Manager (currently a numeric field).
- Email Template Builder: header/footer wrapper, `{{variable}}` interpolation at send time,
  preview, test-send, version history.
- Activity logs UI over `cp_audit_logs` (the table exists; nothing writes to it yet — each
  module's actions would need an audit-log call added).
- CMS module (12+ page types), Media Manager.
- Remaining Settings: SMTP / SMS / Payment Gateway / Google Maps / API Keys / reCAPTCHA /
  Storage.
- 2FA for CP login.

None of the above requires further schema changes to the identity/RBAC/settings layer — new
modules mostly need their own tables (CMS pages, media) plus UI, on top of the auth/RBAC
foundation this phase ships.
