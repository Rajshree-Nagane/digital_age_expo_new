"use server";

import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { updateBranding } from "@/lib/cp/settings/domainRepository";
import { BRANDING_TEXT_FIELDS } from "./fields";

export async function saveBrandingAction(formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const values: Record<string, string> = {};
  for (const field of BRANDING_TEXT_FIELDS) {
    values[field.key] = String(formData.get(field.key) ?? "");
  }

  await updateBranding({
    template: values.template,
    alternate_logo: values.alternate_logo,
    partner_logo: values.partner_logo,
    partner_url: values.partner_url,
    fav: values.fav,
    domain_loader: values.domain_loader,
    show_header_brand_logo: formData.get("show_header_brand_logo") === "on",
    hide_pricing: formData.get("hide_pricing") === "on",
  });

  revalidatePath("/cp/settings/branding");
}
