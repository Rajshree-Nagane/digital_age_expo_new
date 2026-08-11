"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { setSettings } from "@/lib/cp/settings/settingsRepository";
import { TYPOGRAPHY_SETTINGS_FIELDS } from "./fields";
import { optionalText, firstZodIssue } from "../_lib/validation";
import type { SettingsActionState } from "../_components/SettingsForm";

const typographySchema = z.object({
  cp_typography_primary_font: optionalText(150),
  cp_typography_secondary_font: optionalText(150),
  cp_typography_heading_font: optionalText(150),
  cp_typography_body_font: optionalText(150),
  cp_typography_base_font_size: z.union([z.literal(""), z.string().trim().regex(/^\d{1,2}$/, "Enter a number of pixels, e.g. 16.")]),
  cp_typography_heading_scale: z.union([z.literal(""), z.string().trim().regex(/^\d(\.\d{1,2})?$/, "Enter a scale factor, e.g. 1.25.")]),
});

export async function saveTypographySettingsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const raw: Record<string, string> = {};
  for (const field of TYPOGRAPHY_SETTINGS_FIELDS) raw[field.varname] = String(formData.get(field.varname) ?? "");

  const parsed = typographySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: firstZodIssue(parsed.error) };
  }

  await setSettings(parsed.data as Record<string, string>);
  revalidatePath("/cp/settings/typography");
  revalidatePath("/", "layout");
  return { success: true, message: "Settings updated successfully." };
}
