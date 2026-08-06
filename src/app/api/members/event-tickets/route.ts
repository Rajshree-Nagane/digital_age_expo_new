import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventTicketSchema } from "@/lib/validations/eventTicket";
import { getEventTickets, createEventTicket } from "@/lib/services/eventTickets";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const tickets = await getEventTickets(context);
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add ticket types." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createEventTicket(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
