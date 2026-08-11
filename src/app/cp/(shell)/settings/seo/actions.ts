"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { setSettings } from "@/lib/cp/settings/settingsRepository";
import { SEO_TEXT_FIELDS, SEO_ROBOTS_OPTIONS, SEO_IMAGE_FIELDS } from "./fields";
import { optionalText, optionalUrl, optionalImagePath, firstZodIssue } from "../_lib/validation";
import type { SettingsActionState } from "../_components/SettingsForm";

const seoSchema = z.object({
  ...Object.fromEntries(SEO_TEXT_FIELDS.map((f) => [f.varname, "isUrl" in f && f.isUrl ? optionalUrl : optionalText(f.maxLength)])),
  cp_seo_robots: z.union([z.literal(""), z.enum(SEO_ROBOTS_OPTIONS)]),
  ...Object.fromEntries(SEO_IMAGE_FIELDS.map((f) => [f.varname, optionalImagePath])),
});

export async function saveSeoSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const raw: Record<string, string> = { cp_seo_robots: String(formData.get("cp_seo_robots") ?? "") };
  for (const field of SEO_TEXT_FIELDS) raw[field.varname] = String(formData.get(field.varname) ?? "");
  for (const field of SEO_IMAGE_FIELDS) raw[field.varname] = String(formData.get(field.varname) ?? "");

  const parsed = seoSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: firstZodIssue(parsed.error) };
  }

  await setSettings(parsed.data as Record<string, string>);
  revalidatePath("/cp/settings/seo");
  revalidatePath("/", "layout");
  return { success: true, message: "Settings updated successfully." };
}
