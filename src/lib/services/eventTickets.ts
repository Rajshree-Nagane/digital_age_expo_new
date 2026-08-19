import { prisma } from "@/lib/prisma";
import { CACHE_TAGS, cachedRead } from "@/lib/cache";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventTicketInput } from "@/lib/validations/eventTicket";

export interface EventTicketRow {
  id: number;
  name: string;
  subTitle: string;
  description: string | null;
  additionalInfo: string | null;
  amount: string | null;
  applyEarlyBird: boolean;
  earlyBirdDiscount: number | null;
  groupTicketPrice: string | null;
  maxAttendeesAllow: number | null;
  sequence: number | null;
  active: boolean;
  featuredTicket: boolean;
  soldOutTicket: boolean;
}

const SELECT_FIELDS = {
  id: true,
  name: true,
  sub_title: true,
  description: true,
  additional_info: true,
  amount: true,
  apply_early_bird: true,
  early_bird_discount: true,
  group_ticket_price: true,
  max_attendees_allow: true,
  sequence: true,
  active: true,
  featured_ticket: true,
  sold_out_ticket: true,
} as const;

function toRow(t: any): EventTicketRow {
  return {
    id: t.id,
    name: t.name,
    subTitle: t.sub_title ?? "",
    description: t.description,
    additionalInfo: t.additional_info,
    amount: t.amount !== null && t.amount !== undefined ? String(t.amount) : null,
    applyEarlyBird: !!t.apply_early_bird,
    earlyBirdDiscount: t.early_bird_discount,
    groupTicketPrice: t.group_ticket_price !== null && t.group_ticket_price !== undefined ? String(t.group_ticket_price) : null,
    maxAttendeesAllow: t.max_attendees_allow,
    sequence: t.sequence,
    active: !!t.active,
    featuredTicket: t.featured_ticket === 1,
    soldOutTicket: t.sold_out_ticket === 1,
  };
}

/** Mirrors members/event_ticket_buyers.php's list+form (despite its legacy name, that file
 * actually edits ticket *types*) — renamed here to match the navbar's own "Setup Event Tickets"
 * label, which better describes what it does. */
export async function getEventTickets(context: EventMemberContext): Promise<EventTicketRow[]> {
  const rows = await prisma.find_event_ticket.findMany({
    where: { event_id: context.eventId },
    orderBy: [{ sequence: "asc" }, { id: "asc" }],
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

/** Public read of the active, on-sale ticket tiers for the "Buy Conference Pass" page —
 * no member/organiser context required, unlike getEventTickets above. */
async function read_getActiveEventTickets(eventId: number): Promise<EventTicketRow[]> {
  const rows = await prisma.find_event_ticket.findMany({
    where: { event_id: eventId, active: true },
    orderBy: [{ sequence: "asc" }, { id: "asc" }],
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function createEventTicket(context: EventMemberContext, input: EventTicketInput) {
  if (context.role !== "organiser") return null;
  return prisma.find_event_ticket.create({
    data: {
      event_id: context.eventId,
      user_id: context.userId,
      name: input.name,
      sub_title: input.sub_title || "",
      description: input.description || null,
      additional_info: input.additional_info || null,
      amount: input.amount ?? null,
      apply_early_bird: input.apply_early_bird,
      early_bird_discount: input.early_bird_discount ?? null,
      group_ticket_price: input.group_ticket_price ?? null,
      max_attendees_allow: input.max_attendees_allow ?? null,
      sequence: input.sequence ?? 0,
      active: input.active,
      featured_ticket: input.featured_ticket ? 1 : 0,
      sold_out_ticket: input.sold_out_ticket ? 1 : 0,
    },
    select: { id: true },
  });
}

export async function updateEventTicket(context: EventMemberContext, id: number, input: EventTicketInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_ticket.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      name: input.name,
      sub_title: input.sub_title || "",
      description: input.description || null,
      additional_info: input.additional_info || null,
      amount: input.amount ?? null,
      apply_early_bird: input.apply_early_bird,
      early_bird_discount: input.early_bird_discount ?? null,
      group_ticket_price: input.group_ticket_price ?? null,
      max_attendees_allow: input.max_attendees_allow ?? null,
      sequence: input.sequence ?? 0,
      active: input.active,
      featured_ticket: input.featured_ticket ? 1 : 0,
      sold_out_ticket: input.sold_out_ticket ? 1 : 0,
    },
  });
}

export async function deleteEventTicket(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_ticket.deleteMany({ where: { id, event_id: context.eventId } });
}

/**
 * ---------------------------------------------------------------------------
 *  Cached public reads
 * ---------------------------------------------------------------------------
 *
 *  These wrap the readers above so their results are reused across requests
 *  instead of re-queried on every page view — see src/lib/cache.ts for why that
 *  matters here and what is deliberately left uncached (anything per-user or
 *  organiser-facing, which in this file means the *ForAdmin readers and every
 *  update/delete path).
 */
export const getActiveEventTickets = cachedRead(["eventTickets", "getActiveEventTickets"], read_getActiveEventTickets, {
  tags: [CACHE_TAGS.tickets],
});
