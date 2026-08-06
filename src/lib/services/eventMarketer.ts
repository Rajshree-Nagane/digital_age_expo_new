import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventMarketerInput } from "@/lib/validations/eventMarketer";

export interface MarketerRow {
  id: number;
  firstName: string;
  lastName: string;
  business: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  publicationCategory: string | null;
  exchangeServices: boolean;
  exchangeAmount: string | null;
  showOnSpeaker: number;
  showOnVisitor: number;
  showOnSponsor: number;
  showOnUpcomingEvent: number;
  status: string | null;
}

const SELECT_FIELDS = {
  id: true,
  first_name: true,
  last_name: true,
  business: true,
  email: true,
  phone: true,
  title: true,
  description: true,
  image: true,
  publication_category: true,
  exchange_services: true,
  exchange_amount: true,
  show_advertiser_on_speaker: true,
  show_advertiser_on_visitor: true,
  show_advertiser_on_sponsor: true,
  show_advertiser_on_upcoming_event: true,
  status: true,
} as const;

function toRow(m: any): MarketerRow {
  return {
    id: m.id,
    firstName: m.first_name ?? "",
    lastName: m.last_name ?? "",
    business: m.business,
    email: m.email,
    phone: m.phone,
    title: m.title,
    description: m.description,
    image: m.image,
    publicationCategory: m.publication_category,
    exchangeServices: !!m.exchange_services,
    exchangeAmount: m.exchange_amount,
    showOnSpeaker: m.show_advertiser_on_speaker,
    showOnVisitor: m.show_advertiser_on_visitor,
    showOnSponsor: m.show_advertiser_on_sponsor,
    showOnUpcomingEvent: m.show_advertiser_on_upcoming_event,
    status: m.status,
  };
}

/** Mirrors members/event_lobby marketer admin — organiser's list of every marketer/affiliate
 * associated with this event (structurally identical to find_event_advertisor, but a distinct
 * legacy table, hence a distinct service/route/component set). */
export async function getMarketers(context: EventMemberContext): Promise<MarketerRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_event_marketer.findMany({
    where: { event_id: context.eventId },
    orderBy: { id: "desc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

// These columns are NOT NULL with no default in Prisma's create input, but are unrelated to
// this simplified CRUD form — they're legacy required-but-defaultless columns carried over
// from the old schema, so we fill them with inert constants on create only.
const REQUIRED_LEGACY_DEFAULTS = {
  short_description: "",
  fb: "",
  twitter: "",
  profile_pic: "",
  display_order: 0,
} as const;

export async function createMarketer(context: EventMemberContext, input: EventMarketerInput) {
  if (context.role !== "organiser") return null;
  return prisma.find_event_marketer.create({
    data: {
      event_id: context.eventId,
      user_id: context.userId,
      added_by_user_id: context.userId,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      business: input.business || null,
      email: input.email || null,
      phone: input.phone || null,
      title: input.title || null,
      description: input.description || null,
      image: input.image || null,
      publication_category: input.publication_category || null,
      exchange_services: input.exchange_services ? "1" : null,
      exchange_amount: input.exchange_amount || null,
      show_advertiser_on_speaker: input.show_advertiser_on_speaker ? 1 : 0,
      show_advertiser_on_visitor: input.show_advertiser_on_visitor ? 1 : 0,
      show_advertiser_on_sponsor: input.show_advertiser_on_sponsor ? 1 : 0,
      show_advertiser_on_upcoming_event: input.show_advertiser_on_upcoming_event ? 1 : 0,
      status: input.status,
      ...REQUIRED_LEGACY_DEFAULTS,
    },
    select: { id: true },
  });
}

export async function updateMarketer(context: EventMemberContext, id: number, input: EventMarketerInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_marketer.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      business: input.business || null,
      email: input.email || null,
      phone: input.phone || null,
      title: input.title || null,
      description: input.description || null,
      image: input.image || null,
      publication_category: input.publication_category || null,
      exchange_services: input.exchange_services ? "1" : null,
      exchange_amount: input.exchange_amount || null,
      show_advertiser_on_speaker: input.show_advertiser_on_speaker ? 1 : 0,
      show_advertiser_on_visitor: input.show_advertiser_on_visitor ? 1 : 0,
      show_advertiser_on_sponsor: input.show_advertiser_on_sponsor ? 1 : 0,
      show_advertiser_on_upcoming_event: input.show_advertiser_on_upcoming_event ? 1 : 0,
      status: input.status,
    },
  });
}

export async function deleteMarketer(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_marketer.deleteMany({ where: { id, event_id: context.eventId } });
}
