import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventLobbySchema } from "@/lib/validations/eventLobby";
import { getLobbies, createLobby } from "@/lib/services/eventLobby";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const lobbies = await getLobbies(context);
  return NextResponse.json({ lobbies });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add lobby details." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventLobbySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createLobby(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
