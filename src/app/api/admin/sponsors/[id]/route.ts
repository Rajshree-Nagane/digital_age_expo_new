import { NextResponse } from "next/server";
import { requireOrganiser } from "@/lib/auth/requireOrganiser";
import { sponsorStatusSchema } from "@/lib/validations/adminRegistrationStatus";
import { updateSponsorApproval, deleteSponsorRegistration } from "@/lib/services/sponsors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireOrganiser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = sponsorStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  await updateSponsorApproval(Number(id), parsed.data.status);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireOrganiser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await deleteSponsorRegistration(Number(id));
  return NextResponse.json({ success: true });
}
