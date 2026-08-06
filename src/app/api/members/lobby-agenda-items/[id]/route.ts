import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventLobbyAgendaItemSchema } from "@/lib/validations/eventLobbyAgendaItem";
import { updateAgendaItem, deleteAgendaItem } from "@/lib/services/eventLobbyAgendaItems";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can edit sessions." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = eventLobbyAgendaItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateAgendaItem(context, Number(id), parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Session not found or access denied." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can remove sessions." }, { status: 403 });
  }

  const { id } = await params;
  const result = await deleteAgendaItem(context, Number(id));
  if (result.count === 0) {
    return NextResponse.json({ error: "Session not found or access denied." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
