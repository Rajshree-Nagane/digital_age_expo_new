/**
 * One-shot bootstrap for a brand-new CP login — creates the find_users account itself
 * (unlike seed.ts, which requires one to already exist), then does the same role/
 * permission/grant seeding seed.ts does, and promotes the new account to Super Admin.
 *
 * Run with:
 *   npx tsx src/app/cp/_scripts/bootstrap-admin.ts
 *
 * Defaults to login "admin" / password "password123" (override with argv: login, password,
 * email — see the bottom of this file). Safe to re-run: if a find_users row with this login
 * or email already exists, it's reused as-is (its existing password is left untouched) rather
 * than erroring or duplicating.
 *
 * IMPORTANT — heads up on that default password: src/lib/services/member.ts's
 * verifyMemberCredentials() (used by the *member portal's* NextAuth login, not this CP) has a
 * standing "any identifier + password123 logs in as a demo account" fallback for design/
 * testing. That's pre-existing behavior, not something this script changes — but it does mean
 * "admin" / "password123" only reliably reaches this real account through /cp/login (which
 * checks find_users directly, no such fallback). If you ever try those same credentials on
 * the regular member-portal login, you'll hit the demo stub instead. Change the password
 * after your first sign-in (Settings/User Management, once that screen ships) if that matters
 * to you, or pass a different one now — see the bottom of this file.
 */
import { prisma } from "@/lib/prisma";
import { DOMAIN_ID } from "@/lib/site-config";
import { generateSalt, hashPassword } from "@/lib/auth/password";
import { CP_PERMISSIONS, CP_SEED_ROLES } from "@/lib/cp/rbac";
import { ADMIN_LOGIN_PERMISSION } from "@/lib/cp/auth/authRepository";

const ALL_PERMISSIONS = Object.values(CP_PERMISSIONS);
const READ_ONLY_PERMISSIONS = [ADMIN_LOGIN_PERMISSION, ...ALL_PERMISSIONS.filter((p) => p.endsWith("_view"))];

const ROLE_PERMISSION_GRANTS: Record<(typeof CP_SEED_ROLES)[number], string[]> = {
  "Super Admin": ALL_PERMISSIONS,
  Admin: ALL_PERMISSIONS,
  "Event Manager": [ADMIN_LOGIN_PERMISSION, CP_PERMISSIONS.EVENTS_VIEW, CP_PERMISSIONS.EVENTS_EDIT, CP_PERMISSIONS.SETTINGS_VIEW],
  "Content Manager": [
    ADMIN_LOGIN_PERMISSION,
    CP_PERMISSIONS.MENU_MANAGER_VIEW,
    CP_PERMISSIONS.MENU_MANAGER_EDIT,
    CP_PERMISSIONS.MEMBER_MENU_VIEW,
    CP_PERMISSIONS.MEMBER_MENU_EDIT,
  ],
  Marketing: [ADMIN_LOGIN_PERMISSION, CP_PERMISSIONS.MENU_MANAGER_VIEW, CP_PERMISSIONS.SETTINGS_VIEW],
  Sales: [ADMIN_LOGIN_PERMISSION, CP_PERMISSIONS.EVENTS_VIEW],
  "Member Manager": [ADMIN_LOGIN_PERMISSION, CP_PERMISSIONS.USERS_VIEW, CP_PERMISSIONS.USERS_EDIT, CP_PERMISSIONS.USERS_GROUPS_VIEW],
  "Read Only": READ_ONLY_PERMISSIONS,
};

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
  await prisma.find_users_groups_permissions_lookup.create({ data: { group_id: groupId, permission_id: permissionId } });
}

async function ensureMenuItem(input: { title: string; icon: string; link: string; orderby: number; permission?: string }): Promise<void> {
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
  const login = process.argv[2] || "admin";
  const password = process.argv[3] || "password123";
  const email = process.argv[4] || `${login}@digitalageexpo.local`;

  console.log(`Looking for an existing find_users row (login="${login}" or email="${email}")...`);
  let user = await prisma.find_users.findFirst({
    where: { domain_id: DOMAIN_ID, OR: [{ login }, { user_email: email }] },
    select: { id: true, login: true },
  });

  if (user) {
    console.log(`Found existing account "${user.login}" (id=${user.id}) — reusing it, password left unchanged.`);
  } else {
    console.log(`No existing account — creating find_users row for "${login}"...`);
    const salt = generateSalt();
    const hash = hashPassword(password, salt, "sha256");
    // Mirrors createMemberAccount() in src/lib/services/member.ts (the normal registration
    // path) field-for-field, so this account is indistinguishable from a real sign-up.
    const created = await prisma.find_users.create({
      data: {
        domain_id: DOMAIN_ID,
        login,
        user_email: email,
        pass: hash,
        password_salt: salt,
        password_hash: "sha256",
        user_first_name: "Admin",
        user_last_name: "User",
        user_phone: "0000000000",
        user_organization: "",
        user_status: "active",
        terms_accepted: 1,
        created: new Date(),
        date_of_birth: new Date("1970-01-01T00:00:00Z"),
        work_phone: "",
        bank_account_holder_name: "",
        bank_account_sort_code: "",
        bank_account_number: "",
        bank_account_ifsc: "",
        bank_name: "",
        bank_address: "",
        custom_6: "",
        custom_13: "",
        custom_55: "",
        custom_1202: "",
        custom_1203: "",
        custom_1204: "",
        under_franchise_user: 0,
        allocation_date: new Date("1970-01-01T00:00:00Z"),
        under_support_user: 0,
        request_for_frenchise: 0,
        franchise_request_updated_on: new Date("1970-01-01T00:00:00Z"),
        email_verified: 0,
        email_verifed_code: 0,
        is_synced_to_crm: 0,
        is_invoice_sent: 0,
        is_email_sent: 0,
        razorpay_customer_id: "",
        credit_balance: 0,
      },
      select: { id: true, login: true },
    });
    user = created;
    console.log(`Created "${login}" (id=${user.id}), password: ${password}`);
  }

  console.log("Seeding permission catalog, roles, and grants...");
  for (const slug of ALL_PERMISSIONS) await ensurePermission(slug);

  const groupIdByName: Record<string, number> = {};
  for (const roleName of CP_SEED_ROLES) groupIdByName[roleName] = await ensureGroup(roleName);
  for (const [roleName, slugs] of Object.entries(ROLE_PERMISSION_GRANTS)) {
    for (const slug of slugs) await ensureGrant(groupIdByName[roleName], slug);
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

  const superAdminGroupId = groupIdByName["Super Admin"];
  const alreadyMember = await prisma.find_users_groups_lookup.findUnique({
    where: { user_id_group_id: { user_id: user.id, group_id: superAdminGroupId } },
  });
  if (!alreadyMember) {
    await prisma.find_users_groups_lookup.create({ data: { user_id: user.id, group_id: superAdminGroupId } });
  }

  console.log(`\nDone. Sign in at /cp/login with:`);
  console.log(`  Username: ${login}`);
  console.log(`  Password: ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
