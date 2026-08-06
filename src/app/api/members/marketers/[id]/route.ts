import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventMarketerSchema } from "@/lib/validations/eventMarketer";
import { updateMarketer, deleteMarketer } from "@/lib/services/eventMarketer";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can edit marketers." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = eventMarketerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateMarketer(context, Number(id), parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Marketer not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can remove marketers." }, { status: 403 });
  }

  const { id } = await params;
  const result = await deleteMarketer(context, Number(id));
  if (result.count === 0) {
    return NextResponse.json({ error: "Marketer not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
