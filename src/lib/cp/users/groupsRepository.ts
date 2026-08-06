import { prisma } from "@/lib/prisma";
import { CP_PERMISSIONS } from "@/lib/cp/rbac";

const ALL_PERMISSIONS = Object.values(CP_PERMISSIONS);

export interface GroupListItem {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  permissionCount: number;
}

export async function listGroups(): Promise<GroupListItem[]> {
  const groups = await prisma.find_users_groups.findMany({ orderBy: { id: "asc" } });
  const lookups = await prisma.find_users_groups_lookup.findMany();
  const grants = await prisma.find_users_groups_permissions_lookup.findMany();

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    memberCount: lookups.filter((l) => l.group_id === g.id).length,
    permissionCount: grants.filter((p) => p.group_id === g.id).length,
  }));
}

export async function getGroupForEdit(id: number) {
  const group = await prisma.find_users_groups.findUnique({ where: { id } });
  if (!group) return null;
  const grants = await prisma.find_users_groups_permissions_lookup.findMany({ where: { group_id: id } });

  // Every catalog permission this CP knows about, marked with whether this group has it —
  // includes any legacy permission slugs found_users_permissions already has beyond this
  // CP's own catalog is intentionally NOT shown here; this screen only manages the CP's own
  // permission set (see CP_PERMISSIONS in lib/cp/rbac.ts) to keep the checkbox list legible.
  const grantedSlugs = new Set(grants.map((g) => g.permission_id));
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    permissions: ALL_PERMISSIONS.map((slug) => ({ slug, granted: grantedSlugs.has(slug) })),
  };
}

export async function updateGroupDetails(id: number, input: { name: string; description: string }): Promise<void> {
  await prisma.find_users_groups.update({ where: { id }, data: input });
}

export async function setGroupPermissions(id: number, grantedSlugs: string[]): Promise<void> {
  // Ensure every slug this CP knows about exists in the catalog before granting it — a group
  // can only be granted a permission find_users_permissions actually has a row for (matches
  // the FK-less-but-still-meaningful relationship the legacy schema uses everywhere else).
  for (const slug of grantedSlugs) {
    const exists = await prisma.find_users_permissions.findUnique({ where: { id: slug } });
    if (!exists) await prisma.find_users_permissions.create({ data: { id: slug } });
  }

  await prisma.$transaction([
    prisma.find_users_groups_permissions_lookup.deleteMany({
      where: { group_id: id, permission_id: { in: ALL_PERMISSIONS } },
    }),
    ...grantedSlugs.map((slug) =>
      prisma.find_users_groups_permissions_lookup.create({ data: { group_id: id, permission_id: slug } })
    ),
  ]);
}

export async function createGroup(input: { name: string; description: string }): Promise<number> {
  const created = await prisma.find_users_groups.create({
    data: { name: input.name, description: input.description, administrator: 1, advertiser: 0, user: 0 },
  });
  return created.id;
}

/** Refuses to delete a group with members, rather than silently orphaning their find_users_groups_lookup rows. */
export async function deleteGroup(id: number): Promise<{ ok: boolean; error?: string }> {
  const memberCount = await prisma.find_users_groups_lookup.count({ where: { group_id: id } });
  if (memberCount > 0) {
    return { ok: false, error: `This role still has ${memberCount} member(s) — reassign them first.` };
  }
  await prisma.$transaction([
    prisma.find_users_groups_permissions_lookup.deleteMany({ where: { group_id: id } }),
    prisma.find_users_groups.delete({ where: { id } }),
  ]);
  return { ok: true };
}
