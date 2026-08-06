import { NextResponse } from "next/server";
import { requireOrganiser } from "@/lib/auth/requireOrganiser";
import { speakerStatusSchema } from "@/lib/validations/adminRegistrationStatus";
import { updateSpeakerStatus, deleteSpeakerRegistration } from "@/lib/services/speakers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireOrganiser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = speakerStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  await updateSpeakerStatus(Number(id), parsed.data.status);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireOrganiser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await deleteSpeakerRegistration(Number(id));
  return NextResponse.json({ success: true });
}
