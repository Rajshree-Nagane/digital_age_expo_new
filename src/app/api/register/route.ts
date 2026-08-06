import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/register";
import { createMemberAccount, findRegistrationConflict } from "@/lib/services/member";
import { getDomain } from "@/lib/services/domain";
import { PUBLIC_SITE_URL } from "@/lib/site-config";
import { sendTemplatedEmail } from "@/lib/email/sendTemplatedEmail";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { login, first_name, last_name, email, phone, organization, password } = parsed.data;

  const conflict = await findRegistrationConflict(login, email, phone);
  if (conflict) {
    const message =
      conflict === "login_taken"
        ? "That username is already taken."
        : conflict === "email_taken"
          ? "An account with this email already exists."
          : "An account with this phone number already exists.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const user = await createMemberAccount({
    login,
    email,
    password,
    firstName: first_name,
    lastName: last_name,
    phone,
    organization,
  });

  // Best-effort welcome email — see src/lib/email/sendTemplatedEmail.ts's doc comment on why
  // this never throws: a mail hiccup (SMTP not configured yet, provider hiccup, etc.) must
  // never turn a successful registration into an error response. Any failure is just logged.
  const domain = await getDomain();
  const result = await sendTemplatedEmail(
    "user_registration",
    {
      first_name,
      last_name,
      login,
      email,
      site_name: domain.name,
      site_url: PUBLIC_SITE_URL,
    },
    { to: email }
  );
  if (!result.sent) {
    console.warn(`Welcome email not sent for new user id=${user.id}: ${result.reason}`, "error" in result ? result.error : undefined);
  }

  return NextResponse.json({ success: true, id: user.id });
}
