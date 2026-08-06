"use server";

import { revalidatePath } from "next/cache";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { updateCompanyDetails } from "@/lib/cp/settings/domainRepository";
import { COMPANY_DETAILS_FIELDS } from "./fields";

export async function saveCompanyDetailsAction(formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_EDIT);

  const values: Record<string, string> = {};
  for (const field of COMPANY_DETAILS_FIELDS) {
    values[field.key] = String(formData.get(field.key) ?? "");
  }

  await updateCompanyDetails({
    name: values.name,
    brand: values.brand,
    link: values.link,
    short_description: values.short_description,
    email: values.email,
    phone: values.phone,
    address: values.address,
    index_page: values.index_page,
    parent_domain: values.parent_domain,
    // A plain HTML checkbox only appears in FormData at all when checked — its absence means "off".
    status: formData.get("status") === "on",
  });

  revalidatePath("/cp/settings/company");
}
