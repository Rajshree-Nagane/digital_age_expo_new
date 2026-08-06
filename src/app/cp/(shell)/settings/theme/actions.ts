"use server";

import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { setSettings } from "@/lib/cp/settings/settingsRepository";
import { THEME_SETTINGS_FIELDS } from "./fields";

export async function saveThemeSettingsAction(formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const values: Record<string, string> = {};
  for (const field of THEME_SETTINGS_FIELDS) {
    values[field.varname] = String(formData.get(field.varname) ?? "");
  }

  await setSettings(values);
  revalidatePath("/cp/settings/theme");
}
