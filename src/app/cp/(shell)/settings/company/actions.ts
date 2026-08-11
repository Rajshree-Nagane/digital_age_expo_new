"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { updateCompanyDetails } from "@/lib/cp/settings/domainRepository";
import { COMPANY_DETAILS_FIELDS } from "./fields";
import { optionalText, firstZodIssue } from "../_lib/validation";
import type { SettingsActionState } from "../_components/SettingsForm";

const companyDetailsSchema = z.object({
  name: optionalText(255),
  brand: optionalText(255),
  link: optionalText(255),
  short_description: optionalText(2000),
  email: optionalText(255), // Kept loose (not z.email()) — this legacy find_domains.email column
  // predates any format enforcement and may already hold values a strict check would reject.
  phone: optionalText(50),
  address: optionalText(2000),
  index_page: optionalText(255),
  parent_domain: optionalText(255),
});

export async function saveCompanyDetailsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const raw: Record<string, string> = {};
  for (const field of COMPANY_DETAILS_FIELDS) {
    raw[field.key] = String(formData.get(field.key) ?? "");
  }

  const parsed = companyDetailsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: firstZodIssue(parsed.error) };
  }

  const v = parsed.data;
  await updateCompanyDetails({
    name: v.name ?? "",
    brand: v.brand ?? "",
    link: v.link ?? "",
    short_description: v.short_description ?? "",
    email: v.email ?? "",
    phone: v.phone ?? "",
    address: v.address ?? "",
    index_page: v.index_page ?? "",
    parent_domain: v.parent_domain ?? "",
    // A plain HTML checkbox only appears in FormData at all when checked — its absence means "off".
    status: formData.get("status") === "on",
  });

  revalidatePath("/cp/settings/company");
  return { success: true, message: "Settings updated successfully." };
}
