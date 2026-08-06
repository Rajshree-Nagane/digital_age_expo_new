import { getEmailTemplate } from "@/lib/cp/email/emailTemplatesRepository";
import { sendMail, isSmtpConfigured } from "./mailer";

/**
 * Replaces every {{key}} in `text` with variables[key]. A placeholder with no matching
 * variable is left as literal text (e.g. `{{unknown_var}}` stays in the output) rather than
 * silently blanked — a visible stray placeholder is a more obvious bug than an email that
 * quietly loses a sentence.
 */
function interpolate(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match
  );
}

export type SendTemplatedEmailResult =
  | { sent: true }
  | {
      sent: false;
      reason: "template_not_found" | "template_disabled" | "smtp_not_configured" | "send_failed";
      error?: unknown;
    };

/**
 * Loads a find_email_templates row (by id, e.g. "user_registration"), fills in {{variable}}
 * placeholders in its subject/body_html, and sends it via the shared SMTP mailer (mailer.ts).
 *
 * `to` is required and always wins over whatever's in the template's own `recipients` column —
 * that column (per the legacy admin_email_templates.php form) is meant for fixed
 * admin-notification-style addresses, not "whoever just triggered this email," so a per-send
 * recipient makes far more sense for member-facing templates like this one.
 *
 * Never throws — every failure mode (template missing/disabled, SMTP unconfigured, actual send
 * error) comes back as a typed { sent: false, reason } result instead. That's deliberate: a
 * mail hiccup should never be able to fail the caller's real business action (e.g. a new
 * member's account still gets created even if the welcome email doesn't go out) — callers that
 * want to surface the failure can inspect the returned reason and log/report it themselves.
 *
 * NOTE: only body_html is used — this schema's find_email_templates only has that (plus
 * subject) as the migration added columns (see prisma/cp_email_templates_columns.sql); the
 * legacy form's separate body_plain field has no equivalent column here, so there's no
 * plain-text fallback body yet.
 */
export async function sendTemplatedEmail(
  templateId: string,
  variables: Record<string, string>,
  opts: { to: string; cc?: string; bcc?: string }
): Promise<SendTemplatedEmailResult> {
  const template = await getEmailTemplate(templateId);
  if (!template) return { sent: false, reason: "template_not_found" };
  if (template.disable) return { sent: false, reason: "template_disabled" };
  if (!isSmtpConfigured()) return { sent: false, reason: "smtp_not_configured" };

  try {
    await sendMail({
      to: opts.to,
      cc: opts.cc,
      bcc: opts.bcc,
      subject: interpolate(template.subject || "", variables),
      html: interpolate(template.body_html || "", variables),
      fromName: template.from_name || undefined,
      fromAddress: template.from_address || undefined,
      replyTo: template.reply_address || undefined,
    });
    return { sent: true };
  } catch (error) {
    console.error(`Failed to send templated email "${templateId}"`, error);
    return { sent: false, reason: "send_failed", error };
  }
}
