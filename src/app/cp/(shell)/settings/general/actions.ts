"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { CACHE_TAGS, revalidateContent } from "@/lib/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { setSettings } from "@/lib/cp/settings/settingsRepository";
import { setActiveEventId } from "@/lib/cp/events/eventsRepository";
import { GENERAL_SETTINGS_FIELDS } from "./fields";
import { optionalText, optionalUrl, firstZodIssue } from "../_lib/validation";
import type { SettingsActionState } from "../_components/SettingsForm";

const generalSettingsSchema = z.object({
  cp_site_name: optionalText(255),
  cp_site_title: optionalText(255),
  cp_site_tagline: optionalText(255),
  cp_full_description: optionalText(5000),
  cp_organisation_type: optionalText(255),
  cp_registration_number: optionalText(100),
  cp_founded_year: z.union([
    z.literal(""),
    z.string().trim().regex(/^\d{4}$/, "Enter a 4-digit year, e.g. 1998."),
  ]),
  cp_site_url: optionalUrl,
  cp_default_timezone: optionalText(100),
  cp_default_currency: optionalText(10),
  cp_default_language: optionalText(10),
});

export async function saveGeneralSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const raw: Record<string, string> = {};
  for (const field of GENERAL_SETTINGS_FIELDS) {
    raw[field.varname] = String(formData.get(field.varname) ?? "");
  }

  const parsed = generalSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: firstZodIssue(parsed.error) };
  }

  await setSettings(parsed.data as Record<string, string>);

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
      // revalidatePath busts rendered routes only. getDomain() also caches this setting (and the
      // find_domains row) through cachedRead(), keyed by tag — without this the site would keep
      // serving the previous active event until that window expired. See src/lib/cache.ts.
      revalidateContent(CACHE_TAGS.domain, CACHE_TAGS.event);
    }
  }

  revalidatePath("/cp/settings/general");
  return { success: true, message: "Settings updated successfully." };
}
