import { prisma } from "@/lib/prisma";
import { DOMAIN_ID } from "@/lib/site-config";
import { verifyPassword } from "@/lib/auth/password";

/**
 * CP admin authentication — deliberately NOT a separate identity system. Ground-truthed
 * against the legacy admin CP's own source (cp/admin_users.php, cp/admin_users_groups.php,
 * cp/admin_permissions.php): the legacy panel authenticates admins against the exact same
 * `find_users` table (and `pass`/`password_salt`/`password_hash` columns) the member portal
 * uses, and authorizes via a "groups" system — a find_users_groups row IS a role, granted
 * permissions through find_users_groups_permissions_lookup, with `admin_login` acting as the
 * master permission slug that gates CP access at all (see admin_users.php:735, which excludes
 * any group lacking `admin_login` from the group picker when the current admin can't grant
 * admin-editing rights themselves).
 *
 * This file mirrors that exactly, reusing the already-correct password verification at
 * src/lib/auth/password.ts (the same code verifyMemberCredentials() in
 * src/lib/services/member.ts uses) rather than inventing a parallel hash scheme.
 */

export const ADMIN_LOGIN_PERMISSION = "admin_login";

export interface CpAuthenticatedUser {
  id: number;
  name: string;
  email: string;
  /** Every group (role) this user belongs to. */
  groups: { id: number; name: string; administrator: boolean }[];
  /** The group shown as "your role" — the first admin-flagged group, or the first group. */
  primaryGroup: { id: number; name: string };
  /** Union of every permission slug granted by ANY group this user belongs to. */
  permissions: string[];
}

/**
 * Verifies an email/login + password against find_users, exactly like the member portal's
 * verifyMemberCredentials(), then checks the user has the `admin_login` permission through
 * at least one of their groups. Returns null on any failure — every failure reason (wrong
 * password, inactive account, no admin_login permission) is deliberately indistinguishable
 * to the caller, same as the member login, so a login form can't be used to enumerate valid
 * CP accounts.
 */
export async function verifyCpCredentials(
  identifier: string,
  plainPassword: string
): Promise<CpAuthenticatedUser | null> {
  const user = await prisma.find_users.findFirst({
    where: {
      domain_id: DOMAIN_ID,
      OR: [{ login: identifier }, { user_email: identifier }],
    },
    select: {
      id: true,
      login: true,
      pass: true,
      password_salt: true,
      password_hash: true,
      user_email: true,
      user_first_name: true,
      user_last_name: true,
      user_status: true,
    },
  });

  if (!user || user.user_status !== "active") return null;
  if (!verifyPassword(plainPassword, user.password_salt, user.password_hash, user.pass)) {
    return null;
  }

  const authenticated = await loadCpAuthorization(user.id);
  if (!authenticated) return null;
  if (!authenticated.permissions.includes(ADMIN_LOGIN_PERMISSION)) return null;

  return {
    ...authenticated,
    name: `${user.user_first_name} ${user.user_last_name}`.trim() || user.login,
    email: user.user_email,
  };
}

/**
 * Loads a find_users.id's group memberships and the union of permissions those groups
 * grant. Split out from verifyCpCredentials() so middleware/session-refresh code can
 * re-check current permissions without re-verifying a password.
 */
export async function loadCpAuthorization(
  findUserId: number
): Promise<Omit<CpAuthenticatedUser, "name" | "email"> | null> {
  const groupLookups = await prisma.find_users_groups_lookup.findMany({
    where: { user_id: findUserId },
    select: { group_id: true },
  });
  if (groupLookups.length === 0) return null;

  const groupIds = groupLookups.map((g) => g.group_id);

  const groups = await prisma.find_users_groups.findMany({
    where: { id: { in: groupIds } },
    select: { id: true, name: true, administrator: true },
  });
  if (groups.length === 0) return null;

  const permissionLookups = await prisma.find_users_groups_permissions_lookup.findMany({
    where: { group_id: { in: groupIds } },
    select: { permission_id: true },
  });
  const permissions = Array.from(new Set(permissionLookups.map((p) => p.permission_id)));

  const primaryGroup =
    groups.find((g) => g.administrator === 1) ?? groups[0];

  return {
    id: findUserId,
    groups: groups.map((g) => ({ id: g.id, name: g.name, administrator: g.administrator === 1 })),
    primaryGroup: { id: primaryGroup.id, name: primaryGroup.name },
    permissions,
  };
}
