import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { showInfoSchema } from "@/lib/validations/eventShowInfo";
import { getShowInfo, upsertShowInfo } from "@/lib/services/eventShowInfo";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const showInfo = await getShowInfo(context);
  return NextResponse.json({ showInfo });
}

export async function PUT(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can edit Show Info." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = showInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const showInfo = await upsertShowInfo(context, parsed.data);
  return NextResponse.json({ success: true, showInfo });
}
