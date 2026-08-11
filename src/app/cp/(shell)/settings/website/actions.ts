"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { setSettings } from "@/lib/cp/settings/settingsRepository";
import { WEBSITE_TOGGLE_FIELDS, WEBSITE_MAINTENANCE_MESSAGE_VARNAME } from "./fields";
import { onOffToggle, optionalText, firstZodIssue } from "../_lib/validation";
import type { SettingsActionState } from "../_components/SettingsForm";

const websiteSchema = z.object({
  ...Object.fromEntries(WEBSITE_TOGGLE_FIELDS.map((f) => [f.varname, onOffToggle])),
  [WEBSITE_MAINTENANCE_MESSAGE_VARNAME]: optionalText(1000),
});

export async function saveWebsiteBehaviourAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const raw: Record<string, string> = {
    [WEBSITE_MAINTENANCE_MESSAGE_VARNAME]: String(formData.get(WEBSITE_MAINTENANCE_MESSAGE_VARNAME) ?? ""),
  };
  for (const field of WEBSITE_TOGGLE_FIELDS) raw[field.varname] = formData.get(field.varname) === "on" ? "on" : "off";

  const parsed = websiteSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: firstZodIssue(parsed.error) };
  }

  await setSettings(parsed.data as Record<string, string>);
  revalidatePath("/cp/settings/website");
  revalidatePath("/", "layout");
  return { success: true, message: "Settings updated successfully." };
}
