"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { updateGroupDetails, setGroupPermissions, createGroup, deleteGroup } from "@/lib/cp/users/groupsRepository";

export async function updateGroupAction(groupId: number, formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.USERS_GROUPS_EDIT);

  await updateGroupDetails(groupId, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  const grantedSlugs = formData.getAll("permissions").map(String);
  await setGroupPermissions(groupId, grantedSlugs);

  revalidatePath("/cp/users/groups");
  revalidatePath(`/cp/users/groups/${groupId}`);
}

export async function createGroupAction(formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.USERS_GROUPS_EDIT);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const groupId = await createGroup({ name, description: String(formData.get("description") ?? "") });
  // Every new role at least gets admin_login — otherwise it can never sign into the CP at all.
  await setGroupPermissions(groupId, [CP_PERMISSIONS.ADMIN_LOGIN]);

  revalidatePath("/cp/users/groups");
  redirect(`/cp/users/groups/${groupId}`);
}

export async function deleteGroupAction(groupId: number): Promise<{ error?: string }> {
  await requireCpPermission(CP_PERMISSIONS.USERS_GROUPS_DELETE);
  const result = await deleteGroup(groupId);
  revalidatePath("/cp/users/groups");
  return result.ok ? {} : { error: result.error };
}
