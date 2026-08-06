import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CP_SESSION_COOKIE_NAME, verifySessionToken, type CpSessionPayload } from "@/lib/cp/auth/session";

/**
 * Permission slug catalog for this CP. Slugs follow the legacy admin CP's own naming
 * convention (verb-suffixed module names, e.g. "admin_users_edit") so the seed script can
 * grant the exact same slugs the legacy `find_users_permissions` catalog already uses where
 * they overlap, and extend it with new module slugs for parts of this spec the legacy panel
 * didn't have (e.g. CMS, media manager). "Configurable" per the spec means: these are just
 * catalog rows in find_users_permissions, and grants are just rows in
 * find_users_groups_permissions_lookup — an Admin with admin_users_groups_edit can add/remove
 * grants for any group through the UI (module #6, User Management) without a code change.
 */
export const CP_PERMISSIONS = {
  ADMIN_LOGIN: "admin_login",
  SETTINGS_VIEW: "admin_settings_view",
  SETTINGS_EDIT: "admin_settings_edit",
  USERS_VIEW: "admin_users_view",
  USERS_EDIT: "admin_users_edit",
  USERS_DELETE: "admin_users_delete",
  USERS_GROUPS_VIEW: "admin_users_groups_view",
  USERS_GROUPS_EDIT: "admin_users_groups_edit",
  USERS_GROUPS_DELETE: "admin_users_groups_delete",
  EVENTS_VIEW: "admin_events_view",
  EVENTS_EDIT: "admin_events_edit",
  MENU_MANAGER_VIEW: "admin_menu_links_view",
  MENU_MANAGER_EDIT: "admin_menu_links_edit",
  MEMBER_MENU_VIEW: "admin_event_menus_view",
  MEMBER_MENU_EDIT: "admin_event_menus_edit",
  EMAIL_TEMPLATES_VIEW: "admin_email_templates_view",
  EMAIL_TEMPLATES_EDIT: "admin_email_templates_edit",
} as const;

export type CpPermissionSlug = (typeof CP_PERMISSIONS)[keyof typeof CP_PERMISSIONS];

/**
 * The 8 roles from the spec, seeded as find_users_groups rows (see _scripts/seed.ts). Kept
 * here as a single source of truth for the seed script and the "role" dropdown in the User
 * Management UI — the actual permission GRANTS are still just DB rows, editable without
 * touching this list.
 */
export const CP_SEED_ROLES = [
  "Super Admin",
  "Admin",
  "Event Manager",
  "Content Manager",
  "Marketing",
  "Sales",
  "Member Manager",
  "Read Only",
] as const;

/** Reads and verifies the CP session cookie. Returns null rather than redirecting — use requireCpSession() in Server Components/Actions that must redirect on failure. */
export async function getCpSession(): Promise<CpSessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(CP_SESSION_COOKIE_NAME)?.value);
}

/** For Server Components/Actions: redirects to /cp/login if there's no valid session. */
export async function requireCpSession(): Promise<CpSessionPayload> {
  const session = await getCpSession();
  if (!session) redirect("/cp/login");
  return session;
}

/** For Server Components/Actions: redirects to /cp (with a denial banner) if the session lacks `slug`. */
export async function requireCpPermission(slug: CpPermissionSlug): Promise<CpSessionPayload> {
  const session = await requireCpSession();
  if (!session.perms.includes(slug)) {
    redirect(`/cp?denied=${encodeURIComponent(slug)}`);
  }
  return session;
}

export function hasPermission(session: CpSessionPayload | null, slug: CpPermissionSlug): boolean {
  return !!session?.perms.includes(slug);
}
