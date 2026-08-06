import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventLobbyAgendaTrackSchema } from "@/lib/validations/eventLobbyAgendaTrack";
import { getPrimaryLobby } from "@/lib/services/eventLobby";
import { getAgendaTracks, createAgendaTrack } from "@/lib/services/eventLobbyAgendaItems";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can view session tracks." }, { status: 403 });
  }

  const lobby = await getPrimaryLobby(context);
  if (!lobby) {
    return NextResponse.json({ error: "Set up the parent lobby before adding a schedule." }, { status: 404 });
  }

  const tracks = await getAgendaTracks(context, lobby.id);
  return NextResponse.json({ tracks });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add session tracks." }, { status: 403 });
  }

  const lobby = await getPrimaryLobby(context);
  if (!lobby) {
    return NextResponse.json({ error: "Set up the parent lobby before adding a schedule." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = eventLobbyAgendaTrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createAgendaTrack(context, lobby.id, parsed.data);
  if (!created) {
    return NextResponse.json({ error: "Could not create this track." }, { status: 400 });
  }
  return NextResponse.json({ success: true, id: created.id }, { status: 201 });
}
