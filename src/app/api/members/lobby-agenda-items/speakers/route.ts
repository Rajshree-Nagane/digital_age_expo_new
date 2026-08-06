import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getAgendaAssignableSpeakers } from "@/lib/services/eventLobbyAgendaItems";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can view speakers." }, { status: 403 });
  }

  const speakers = await getAgendaAssignableSpeakers(context);
  return NextResponse.json({ speakers });
}
