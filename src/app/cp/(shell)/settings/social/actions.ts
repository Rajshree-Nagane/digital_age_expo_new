"use server";

import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { updateSocialMedia } from "@/lib/cp/settings/domainRepository";
import { SOCIAL_MEDIA_FIELDS } from "./fields";

export async function saveSocialMediaAction(formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const values: Record<string, string> = {};
  for (const field of SOCIAL_MEDIA_FIELDS) {
    values[field.key] = String(formData.get(field.key) ?? "");
  }

  await updateSocialMedia({
    facebook: values.facebook,
    instagram: values.instagram,
    youtube: values.youtube,
    google: values.google,
    twitter: values.twitter,
    linkedin: values.linkedin,
  });

  revalidatePath("/cp/settings/social");
}
