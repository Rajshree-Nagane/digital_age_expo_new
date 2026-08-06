import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventAdvertiserSchema } from "@/lib/validations/eventAdvertiser";
import { updateAdvertiser, deleteAdvertiser } from "@/lib/services/eventAdvertiser";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can edit advertisers." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = eventAdvertiserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateAdvertiser(context, Number(id), parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Advertiser not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can remove advertisers." }, { status: 403 });
  }

  const { id } = await params;
  const result = await deleteAdvertiser(context, Number(id));
  if (result.count === 0) {
    return NextResponse.json({ error: "Advertiser not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
