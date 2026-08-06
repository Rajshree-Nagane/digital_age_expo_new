"use server";

import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { setSettings } from "@/lib/cp/settings/settingsRepository";
import { setActiveEventId } from "@/lib/cp/events/eventsRepository";
import { GENERAL_SETTINGS_FIELDS } from "./fields";

export async function saveGeneralSettingsAction(formData: FormData): Promise<{ ok: boolean }> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const values: Record<string, string> = {};
  for (const field of GENERAL_SETTINGS_FIELDS) {
    values[field.varname] = String(formData.get(field.varname) ?? "");
  }

  await setSettings(values);

  // "Select an Event" (blank) leaves the current active event untouched rather than clearing
  // it — there's no valid "no active event" state once one has been chosen (getDomain() always
  // needs a resolvable event_id, falling back to DEFAULT_EVENT_ID otherwise).
  const eventIdRaw = formData.get("event_id");
  if (eventIdRaw) {
    const eventId = Number(eventIdRaw);
    if (Number.isFinite(eventId)) {
      await setActiveEventId(eventId);
      revalidatePath("/cp/events");
      // This setting drives getDomain() (src/lib/services/domain.ts) for the ENTIRE public/
      // member site — "layout" busts the root layout's whole subtree so a production build
      // (which statically caches pages that don't opt out) reflects the new active event
      // immediately, the same fix applied to Events Management's "Mark Active" action.
      revalidatePath("/", "layout");
    }
  }

  revalidatePath("/cp/settings/general");
  return { ok: true };
}
