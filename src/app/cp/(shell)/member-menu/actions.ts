"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { createEventMenu, updateEventMenu, deleteEventMenu, type EventMenuInput } from "@/lib/cp/menus/eventMenusRepository";

function parseInput(formData: FormData): EventMenuInput {
  return {
    title: String(formData.get("title") ?? ""),
    link: String(formData.get("link") ?? ""),
    menu_type: String(formData.get("menu_type") ?? "link"),
    event_category: String(formData.get("event_category") ?? "default"),
    icon: String(formData.get("icon") ?? ""),
    color: String(formData.get("color") ?? "primary"),
    sequence: Number(formData.get("sequence") ?? 0),
    visible: formData.get("visible") === "on",
    visitor: formData.get("visitor") === "on",
    organiser: formData.get("organiser") === "on",
    exhibitor: formData.get("exhibitor") === "on",
    sponsor: formData.get("sponsor") === "on",
    speaker: formData.get("speaker") === "on",
    partner: formData.get("partner") === "on",
    marketer: formData.get("marketer") === "on",
    menu_group: String(formData.get("menu_group") ?? ""),
  };
}

export async function createEventMenuAction(formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.MEMBER_MENU_EDIT);
  const id = await createEventMenu(parseInput(formData));
  revalidatePath("/cp/member-menu");
  redirect(`/cp/member-menu/${id}`);
}

export async function updateEventMenuAction(id: number, formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.MEMBER_MENU_EDIT);
  await updateEventMenu(id, parseInput(formData));
  revalidatePath("/cp/member-menu");
  revalidatePath(`/cp/member-menu/${id}`);
}

export async function deleteEventMenuAction(id: number): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.MEMBER_MENU_EDIT);
  await deleteEventMenu(id);
  revalidatePath("/cp/member-menu");
  redirect("/cp/member-menu");
}
