import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventLobbySpotSchema } from "@/lib/validations/eventLobbySpot";
import { createSpot } from "@/lib/services/eventLobbySpots";
import { getPrimaryLobby } from "@/lib/services/eventLobby";

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add lobby spots." }, { status: 403 });
  }

  const lobby = await getPrimaryLobby(context);
  if (!lobby) {
    return NextResponse.json({ error: "Set up the parent lobby before adding spots." }, { status: 400 });
  }

  const body = await request.json();
  const parsed = eventLobbySpotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  let childId: number | null = null;
  if (body.child_id) {
    const child = await prisma.find_event_lobby_child_layout_manager.findFirst({
      where: { id: Number(body.child_id), event_id: context.eventId },
      select: { id: true },
    });
    if (!child) return NextResponse.json({ error: "Child lobby not found." }, { status: 404 });
    childId = child.id;
  }

  const created = await createSpot(context, { eventLayoutId: lobby.id, childId }, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
