/**
 * Bootstraps the Admin Control Panel on top of the EXISTING legacy tables — creates no new
 * identity/RBAC tables (see schema.prisma's ADMIN CONTROL PANEL header comment). Safe to run
 * more than once: every step is create-if-missing, so it never duplicates or overwrites a
 * group/permission/menu-item that's already there (including legacy ones from the original
 * findusonweb install, which this script never touches).
 *
 * Run with:
 *   npx tsx src/app/cp/_scripts/seed.ts you@example.com
 *
 * The email/username argument must already be a find_users row on this domain (DOMAIN_ID in
 * src/lib/site-config.ts) — this script deliberately does NOT create a find_users row itself.
 * That table has dozens of NOT NULL legacy columns with no DB-level defaults (see
 * LEGACY_UNUSED_USER_FIELDS in src/lib/services/member.ts for the columns member registration
 * already has to fill in) — reusing that exact, already-tested registration path is safer
 * than this script guessing at placeholder values for a table it doesn't own. Register the
 * account through the normal member sign-up flow (or have one already), then run this script
 * to grant it Super Admin.
 */
import { prisma } from "@/lib/prisma";
import { DOMAIN_ID } from "@/lib/site-config";
import { CP_PERMISSIONS, CP_SEED_ROLES } from "@/lib/cp/rbac";
import { ADMIN_LOGIN_PERMISSION } from "@/lib/cp/auth/authRepository";

const ALL_PERMISSIONS = Object.values(CP_PERMISSIONS);

/** Read-heavy role — every *_VIEW slug plus admin_login, nothing that mutates data. */
const READ_ONLY_PERMISSIONS = [
  ADMIN_LOGIN_PERMISSION,
  ...ALL_PERMISSIONS.filter((p) => p.endsWith("_view")),
];

const ROLE_PERMISSION_GRANTS: Record<(typeof CP_SEED_ROLES)[number], string[]> = {
  "Super Admin": ALL_PERMISSIONS,
  Admin: ALL_PERMISSIONS,
  "Event Manager": [
    ADMIN_LOGIN_PERMISSION,
    CP_PERMISSIONS.EVENTS_VIEW,
    CP_PERMISSIONS.EVENTS_EDIT,
    CP_PERMISSIONS.SETTINGS_VIEW,
  ],
  "Content Manager": [
    ADMIN_LOGIN_PERMISSION,
    CP_PERMISSIONS.MENU_MANAGER_VIEW,
    CP_PERMISSIONS.MENU_MANAGER_EDIT,
    CP_PERMISSIONS.MEMBER_MENU_VIEW,
    CP_PERMISSIONS.MEMBER_MENU_EDIT,
  ],
  Marketing: [ADMIN_LOGIN_PERMISSION, CP_PERMISSIONS.MENU_MANAGER_VIEW, CP_PERMISSIONS.SETTINGS_VIEW],
  Sales: [ADMIN_LOGIN_PERMISSION, CP_PERMISSIONS.EVENTS_VIEW],
  "Member Manager": [
    ADMIN_LOGIN_PERMISSION,
    CP_PERMISSIONS.USERS_VIEW,
    CP_PERMISSIONS.USERS_EDIT,
    CP_PERMISSIONS.USERS_GROUPS_VIEW,
  ],
  "Read Only": READ_ONLY_PERMISSIONS,
};

/** find_users_groups.{administrator,advertiser,user} are UnsignedTinyInt "which permission bucket applies" flags (see admin_users_groups.php) — every CP role is admin-bucketed. */
async function ensureGroup(name: string): Promise<number> {
  const existing = await prisma.find_users_groups.findFirst({ where: { name } });
  if (existing) return existing.id;

  const created = await prisma.find_users_groups.create({
    data: { name, description: `Admin Control Panel role: ${name}`, administrator: 1, advertiser: 0, user: 0 },
  });
  console.log(`Created group "${name}" (id=${created.id})`);
  return created.id;
}

async function ensurePermission(slug: string): Promise<void> {
  const existing = await prisma.find_users_permissions.findUnique({ where: { id: slug } });
  if (existing) return;
  await prisma.find_users_permissions.create({ data: { id: slug } });
  console.log(`Created permission "${slug}"`);
}

async function ensureGrant(groupId: number, permissionId: string): Promise<void> {
  const existing = await prisma.find_users_groups_permissions_lookup.findUnique({
    where: { group_id_permission_id: { group_id: groupId, permission_id: permissionId } },
  });
  if (existing) return;
  await prisma.find_users_groups_permissions_lookup.create({
    data: { group_id: groupId, permission_id: permissionId },
  });
}

async function ensureMenuItem(input: {
  title: string;
  icon: string;
  link: string;
  orderby: number;
  permission?: string;
}): Promise<void> {
  const existing = await prisma.find_dashboard_menu.findFirst({ where: { link: input.link } });
  if (existing) return;
  await prisma.find_dashboard_menu.create({
    data: {
      title: input.title,
      icon: input.icon,
      page_name: input.link,
      color: "primary",
      link: input.link,
      visible: true,
      orderby: input.orderby,
      advertiser: false,
      seller: false,
      franchise: false,
      admin: true,
      check_permission: input.permission ? 1 : 0,
      permission: input.permission ?? null,
      menu_group: "cp",
    },
  });
  console.log(`Created menu item "${input.title}" -> ${input.link}`);
}

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error("Usage: npx tsx src/app/cp/_scripts/seed.ts <email-or-username>");
    console.error("(that account must already exist — see this file's top comment for why)");
    process.exit(1);
  }

  console.log("Seeding permission catalog...");
  for (const slug of ALL_PERMISSIONS) {
    await ensurePermission(slug);
  }

  console.log("Seeding roles (find_users_groups) and grants...");
  const groupIdByName: Record<string, number> = {};
  for (const roleName of CP_SEED_ROLES) {
    groupIdByName[roleName] = await ensureGroup(roleName);
  }
  for (const [roleName, slugs] of Object.entries(ROLE_PERMISSION_GRANTS)) {
    const groupId = groupIdByName[roleName];
    for (const slug of slugs) {
      await ensureGrant(groupId, slug);
    }
  }

  console.log("Seeding CP sidebar (find_dashboard_menu)...");
  await ensureMenuItem({ title: "Dashboard", icon: "dashboard", link: "/cp", orderby: 0 });
  await ensureMenuItem({
    title: "General Settings",
    icon: "settings",
    link: "/cp/settings/general",
    orderby: 10,
    permission: CP_PERMISSIONS.SETTINGS_VIEW,
  });

  console.log(`Looking up "${identifier}" in find_users (domain_id=${DOMAIN_ID})...`);
  const user = await prisma.find_users.findFirst({
    where: { domain_id: DOMAIN_ID, OR: [{ login: identifier }, { user_email: identifier }] },
    select: { id: true, login: true, user_email: true },
  });
  if (!user) {
    console.error(
      `No find_users row matches "${identifier}" on domain_id=${DOMAIN_ID}. Register this ` +
        `account first (normal member sign-up), then re-run this script.`
    );
    process.exit(1);
  }

  const superAdminGroupId = groupIdByName["Super Admin"];
  const alreadyMember = await prisma.find_users_groups_lookup.findUnique({
    where: { user_id_group_id: { user_id: user.id, group_id: superAdminGroupId } },
  });
  if (!alreadyMember) {
    await prisma.find_users_groups_lookup.create({
      data: { user_id: user.id, group_id: superAdminGroupId },
    });
    console.log(`Granted "${user.login}" (find_users.id=${user.id}) the Super Admin role.`);
  } else {
    console.log(`"${user.login}" already has the Super Admin role.`);
  }

  console.log("\nDone. Sign in at /cp/login with this account's existing site password.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
