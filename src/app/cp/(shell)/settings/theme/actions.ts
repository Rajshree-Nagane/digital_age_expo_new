"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { setSettings } from "@/lib/cp/settings/settingsRepository";
import { THEME_COLOR_FIELDS } from "./fields";
import { optionalHexColor, onOffToggle, firstZodIssue } from "../_lib/validation";
import type { SettingsActionState } from "../_components/SettingsForm";

const themeSchema = z.object({
  ...Object.fromEntries(THEME_COLOR_FIELDS.map((f) => [f.varname, optionalHexColor])),
  cp_theme_dark_mode: onOffToggle,
});

export async function saveThemeSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const raw: Record<string, string> = {};
  for (const field of THEME_COLOR_FIELDS) raw[field.varname] = String(formData.get(field.varname) ?? "");
  raw.cp_theme_dark_mode = formData.get("cp_theme_dark_mode") === "on" ? "on" : "off";

  const parsed = themeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: firstZodIssue(parsed.error) };
  }

  await setSettings(parsed.data as Record<string, string>);
  revalidatePath("/cp/settings/theme");
  // Theme colors are read site-wide once Phase 2 wires the public layout to consume them —
  // busting the whole layout subtree here (not just this page) means a production build
  // reflects a color change immediately instead of waiting for its own cache to expire.
  revalidatePath("/", "layout");
  return { success: true, message: "Settings updated successfully." };
}
