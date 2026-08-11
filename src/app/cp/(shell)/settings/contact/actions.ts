"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { setSettings } from "@/lib/cp/settings/settingsRepository";
import { CONTACT_SETTINGS_FIELDS } from "./fields";
import { optionalText, optionalEmail, optionalUrl, firstZodIssue } from "../_lib/validation";
import type { SettingsActionState } from "../_components/SettingsForm";

const kindToSchema = { email: optionalEmail, url: optionalUrl, text: optionalText(255) } as const;

const contactSettingsSchema = z.object(
  Object.fromEntries(CONTACT_SETTINGS_FIELDS.map((f) => [f.varname, kindToSchema[f.kind]]))
);

export async function saveContactSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const raw: Record<string, string> = {};
  for (const field of CONTACT_SETTINGS_FIELDS) {
    raw[field.varname] = String(formData.get(field.varname) ?? "");
  }

  const parsed = contactSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: firstZodIssue(parsed.error) };
  }

  await setSettings(parsed.data as Record<string, string>);
  revalidatePath("/cp/settings/contact");
  return { success: true, message: "Settings updated successfully." };
}
