import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventLobbyChildSchema } from "@/lib/validations/eventLobbyChild";
import { getChildLobbies, createChildLobby } from "@/lib/services/eventLobbyChild";
import { getPrimaryLobby } from "@/lib/services/eventLobby";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const lobby = await getPrimaryLobby(context);
  if (!lobby) return NextResponse.json({ childLobbies: [] });

  const childLobbies = await getChildLobbies(context, lobby.id);
  return NextResponse.json({ childLobbies });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add child lobby details." }, { status: 403 });
  }

  const lobby = await getPrimaryLobby(context);
  if (!lobby) {
    return NextResponse.json({ error: "Set up the parent lobby before adding a child lobby." }, { status: 400 });
  }

  const body = await request.json();
  const parsed = eventLobbyChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createChildLobby(context, lobby.id, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
