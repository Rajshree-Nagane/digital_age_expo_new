"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { createMenuLink, updateMenuLink, deleteMenuLink, type MenuLinkInput } from "@/lib/cp/menus/menuLinksRepository";

function parseInput(formData: FormData): MenuLinkInput {
  const parentRaw = String(formData.get("parent_id") ?? "");
  return {
    title: String(formData.get("title") ?? ""),
    link: String(formData.get("link") ?? ""),
    parent_id: parentRaw ? Number(parentRaw) : null,
    target: String(formData.get("target") ?? "_self"),
    ordering: Number(formData.get("ordering") ?? 0),
    active: formData.get("active") === "on",
    logged_in: formData.get("logged_in") === "on",
    logged_out: formData.get("logged_out") === "on",
    icon: String(formData.get("icon") ?? ""),
    color: String(formData.get("color") ?? ""),
  };
}

export async function createMenuLinkAction(formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.MENU_MANAGER_EDIT);
  const id = await createMenuLink(parseInput(formData));
  revalidatePath("/cp/menu-manager");
  redirect(`/cp/menu-manager/${id}`);
}

export async function updateMenuLinkAction(id: number, formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.MENU_MANAGER_EDIT);
  await updateMenuLink(id, parseInput(formData));
  revalidatePath("/cp/menu-manager");
  revalidatePath(`/cp/menu-manager/${id}`);
}

export async function deleteMenuLinkAction(id: number): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.MENU_MANAGER_EDIT);
  await deleteMenuLink(id);
  revalidatePath("/cp/menu-manager");
  redirect("/cp/menu-manager");
}
