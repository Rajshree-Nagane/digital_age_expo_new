import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomain } from "@/lib/services/domain";
import { ticketPurchaseSchema } from "@/lib/validations/ticketPurchase";

// Mirrors the legacy-required-but-defaultless columns on find_events_rsvp that
// eventVisitors.ts's createVisitor() also has to fill in (table-seating / email-campaign
// flags this public form doesn't expose).
const REQUIRED_RSVP_DEFAULTS = {
  initial_table_position: 0,
  anchor_seat_holder: 0,
  last_position_holder: 0,
  the_booth_announcement: false,
  send_along_information: false,
  booth_teaser: false,
  while_at_the_show: false,
  keep_it_simple: false,
  request_a_follow_up_chat: false,
  offer_to_soothe_their_pain_points: false,
  how_can_i_help: false,
} as const;

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = ticketPurchaseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const domain = await getDomain();
  if (!domain.event_id) {
    return NextResponse.json({ error: "No event is configured for this site." }, { status: 400 });
  }

  const { ticket_id, first_name, last_name, email, phone, business } = parsed.data;

  const ticket = await prisma.find_event_ticket.findFirst({
    where: { id: ticket_id, event_id: domain.event_id, active: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "This ticket is no longer available." }, { status: 404 });
  }
  if (ticket.sold_out_ticket === 1) {
    return NextResponse.json({ error: "This ticket is sold out." }, { status: 409 });
  }

  const fullName = `${first_name} ${last_name}`.trim();

  // Two records, matching how the members area reads this data back: the attendee goes into
  // find_events_rsvp (the same table the organiser's Visitors list reads from), and the ticket
  // selection is logged in find_event_ticket_purchased (the same table Ticket Buyers reads
  // from). paid_amount is left null — there's no live payment gateway wired up here, so this
  // records a genuine ticket *request* for the organiser to follow up on and confirm payment,
  // rather than falsely claiming a card was charged.
  const [rsvp, purchase] = await prisma.$transaction([
    prisma.find_events_rsvp.create({
      data: {
        event_id: domain.event_id,
        first_name,
        last_name,
        name: fullName,
        email,
        phone: phone || null,
        business: business || null,
        description: `Ticket request: ${ticket.name}`,
        status: "Registered",
        joining_status: "Pending",
        ...REQUIRED_RSVP_DEFAULTS,
      },
      select: { id: true },
    }),
    prisma.find_event_ticket_purchased.create({
      data: {
        ticket_id: ticket.id,
        event_id: domain.event_id,
        name: ticket.name,
        description: ticket.description,
        amount: ticket.amount,
        apply_early_bird: ticket.apply_early_bird,
        early_bird_discount: ticket.early_bird_discount,
        purchased_on: new Date(),
      },
      select: { id: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    rsvpId: rsvp.id,
    purchaseId: purchase.id,
  });
}
