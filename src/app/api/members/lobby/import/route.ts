import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { importLobbyFromTemplate } from "@/lib/services/eventLobby";

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can import lobby templates." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const templateId = Number(body?.template_id);
  if (!templateId) {
    return NextResponse.json({ error: "A template must be selected." }, { status: 400 });
  }

  const created = await importLobbyFromTemplate(context, templateId);
  if (!created) {
    return NextResponse.json({ error: "That template could not be found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, id: created.id }, { status: 201 });
}
