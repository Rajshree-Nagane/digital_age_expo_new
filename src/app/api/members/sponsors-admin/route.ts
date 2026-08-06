import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventSponsorAdminSchema } from "@/lib/validations/eventSponsorAdmin";
import { getSponsorsAdmin, createSponsorAdmin } from "@/lib/services/eventSponsorAdmin";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const sponsors = await getSponsorsAdmin(context);
  return NextResponse.json({ sponsors });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add sponsors." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventSponsorAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createSponsorAdmin(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
