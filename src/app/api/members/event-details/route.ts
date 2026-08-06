import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventDetailsSchema } from "@/lib/validations/eventDetails";
import { getEventDetails, updateEventDetails } from "@/lib/services/eventDetails";

export async function GET(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can view this." }, { status: 403 });
  }

  const details = await getEventDetails(context);
  return NextResponse.json({ details });
}

export async function PUT(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can edit event details." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  await updateEventDetails(context, parsed.data);
  return NextResponse.json({ success: true });
}
