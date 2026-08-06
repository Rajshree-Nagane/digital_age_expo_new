import { NextResponse } from "next/server";
import { getDomain } from "@/lib/services/domain";
import { createFreeTicketRsvp, findFreeTicketConflict } from "@/lib/services/freeTicket";
import { freeTicketSchema } from "@/lib/validations/freeTicket";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = freeTicketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const domain = await getDomain();
  if (!domain.event_id) {
    return NextResponse.json({ error: "No event is configured for this site." }, { status: 400 });
  }

  const conflict = await findFreeTicketConflict(domain.event_id, parsed.data.email);
  if (conflict) {
    return NextResponse.json({ error: "You have already claimed a free ticket with this email." }, { status: 409 });
  }

  const rsvp = await createFreeTicketRsvp(domain.event_id, parsed.data);

  return NextResponse.json({ success: true, id: rsvp.id });
}
