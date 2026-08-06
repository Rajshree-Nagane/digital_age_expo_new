import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { securityDetailsSchema } from "@/lib/validations/security";
import { updateSecurityDetails } from "@/lib/services/member";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = securityDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { first_name, last_name, phone, organization, new_password } = parsed.data;

  await updateSecurityDetails(Number(session.user.id), {
    firstName: first_name,
    lastName: last_name,
    phone,
    organization,
    newPassword: new_password || undefined,
  });

  return NextResponse.json({ success: true });
}
