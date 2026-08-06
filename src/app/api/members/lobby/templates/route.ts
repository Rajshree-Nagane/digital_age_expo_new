import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getLobbyTemplates } from "@/lib/services/eventLobby";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can import lobby templates." }, { status: 403 });
  }

  const templates = await getLobbyTemplates();
  return NextResponse.json({ templates });
}
