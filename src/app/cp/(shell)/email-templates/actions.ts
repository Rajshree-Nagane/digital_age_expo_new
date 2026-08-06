"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { updateEmailTemplate, duplicateEmailTemplate } from "@/lib/cp/email/emailTemplatesRepository";

export async function updateEmailTemplateAction(id: string, formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.EMAIL_TEMPLATES_EDIT);

  await updateEmailTemplate(id, {
    recipients: String(formData.get("recipients") ?? ""),
    from_name: String(formData.get("from_name") ?? ""),
    from_address: String(formData.get("from_address") ?? ""),
    reply_name: String(formData.get("reply_name") ?? ""),
    reply_address: String(formData.get("reply_address") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    body_html: String(formData.get("body_html") ?? ""),
    disable: formData.get("disable") === "on",
    moderate: formData.get("moderate") === "on",
  });

  revalidatePath("/cp/email-templates");
  revalidatePath(`/cp/email-templates/${id}`);
}

export async function duplicateEmailTemplateAction(sourceId: string, formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.EMAIL_TEMPLATES_EDIT);
  const newId = String(formData.get("newId") ?? "").trim();
  if (!newId) return;

  await duplicateEmailTemplate(sourceId, newId);
  revalidatePath("/cp/email-templates");
  redirect(`/cp/email-templates/${newId}`);
}
