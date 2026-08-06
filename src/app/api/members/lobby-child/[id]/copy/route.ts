import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { copyChildLobby } from "@/lib/services/eventLobbyChild";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can copy child lobby details." }, { status: 403 });
  }

  const { id } = await params;
  const copied = await copyChildLobby(context, Number(id));
  if (!copied) {
    return NextResponse.json({ error: "This layout type can't be copied." }, { status: 400 });
  }
  return NextResponse.json({ success: true, id: copied.id }, { status: 201 });
}
