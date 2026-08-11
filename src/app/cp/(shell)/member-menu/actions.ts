"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { createEventMenu, updateEventMenu, deleteEventMenu, type EventMenuInput } from "@/lib/cp/menus/eventMenusRepository";

/**
 * find_event_menus.page_name is required (NOT NULL, no default) but isn't a field the CP form
 * exposes — it's derived from the link so the form can stay simple. Strips the "/members" base
 * and any query string, e.g. "/members/event_show_info?event_id=852" -> "event_show_info".
 */
function derivePageName(link: string): string {
  const withoutQuery = link.split("?")[0];
  const trimmed = withoutQuery.replace(/^\/*(members\/)?/, "").replace(/\/+$/, "");
  return trimmed || "link";
}

function parseInput(formData: FormData): EventMenuInput {
  const link = String(formData.get("link") ?? "");
  return {
    title: String(formData.get("title") ?? ""),
    link,
    page_name: derivePageName(link),
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
