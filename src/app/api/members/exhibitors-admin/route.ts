import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventExhibitorAdminSchema } from "@/lib/validations/eventExhibitorAdmin";
import { getExhibitorsAdmin, createExhibitorAdmin } from "@/lib/services/eventExhibitorAdmin";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const exhibitors = await getExhibitorsAdmin(context);
  return NextResponse.json({ exhibitors });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add exhibitors." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventExhibitorAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createExhibitorAdmin(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
