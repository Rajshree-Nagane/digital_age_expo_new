import nodemailer, { type Transporter } from "nodemailer";

/**
 * Single shared SMTP transport, built from the SMTP_* env vars already documented in .env
 * ("Outbound email (password reset). Required for /forgot-password to actually deliver a
 * code — leave unset and that endpoint will return a clear error instead of failing
 * silently."). This module is what makes that promise real: isSmtpConfigured()/getTransport()
 * fail with one specific, readable error instead of nodemailer failing later with an opaque
 * connection error when SMTP_HOST is blank (the shipped .env default).
 *
 * Requires the `nodemailer` package — add it with `npm install nodemailer @types/nodemailer`
 * (already added to package.json's dependencies; this cloud sandbox has no network access to
 * your machine, so the actual `npm install` has to run on your side).
 */

let cachedTransport: Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;
  if (!isSmtpConfigured()) {
    throw new Error(
      "SMTP is not configured — set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env before sending email."
    );
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // the standard convention: 465 is implicit TLS, 587/25 use STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransport;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  fromName?: string;
  fromAddress?: string;
}

/** Low-level send — one email, no template lookup. Throws on failure (SMTP unconfigured, auth error, etc.); callers that shouldn't ever throw (e.g. a registration flow's welcome email) should use sendTemplatedEmail() instead, which catches this. */
export async function sendMail(input: SendMailInput): Promise<void> {
  const transport = getTransport();
  const fromAddress = input.fromAddress || process.env.SMTP_FROM || process.env.SMTP_USER || "";
  const from = input.fromName ? `"${input.fromName}" <${fromAddress}>` : fromAddress;

  await transport.sendMail({
    from,
    to: input.to,
    cc: input.cc || undefined,
    bcc: input.bcc || undefined,
    replyTo: input.replyTo || undefined,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
