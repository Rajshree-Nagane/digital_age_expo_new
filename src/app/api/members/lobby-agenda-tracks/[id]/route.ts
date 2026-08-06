import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventLobbyAgendaTrackSchema } from "@/lib/validations/eventLobbyAgendaTrack";
import { updateAgendaTrack, deleteAgendaTrack } from "@/lib/services/eventLobbyAgendaItems";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can edit session tracks." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = eventLobbyAgendaTrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateAgendaTrack(context, Number(id), parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Track not found or access denied." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can remove session tracks." }, { status: 403 });
  }

  const { id } = await params;
  const result = await deleteAgendaTrack(context, Number(id));
  if ("error" in result && result.error === "blocked") {
    return NextResponse.json({ error: "Remove or move this track's sessions first." }, { status: 409 });
  }
  if (result.count === 0) {
    return NextResponse.json({ error: "Track not found or access denied." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
