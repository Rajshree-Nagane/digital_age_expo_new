import { prisma } from "@/lib/prisma";
import { REFERRAL_SOURCE_OPTIONS, type FreeTicketInput } from "@/lib/validations/freeTicket";

// A handful of legacy required-but-defaultless columns on find_events_rsvp unrelated to a
// simple public ticket claim (table-seating and a specific email-campaign flow). Filled with
// inert values so `create` doesn't fail on NOT NULL columns this form doesn't expose.
// Mirrors the same defaults used by members/view_visitor.php's create path (see eventVisitors.ts).
const REQUIRED_LEGACY_DEFAULTS = {
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

function referralLabel(code: string | undefined): string | null {
  if (!code) return null;
  return REFERRAL_SOURCE_OPTIONS.find((opt) => opt.code === code)?.label ?? null;
}

/** Mirrors event_register.php's `guest_rsvp` ajax action → Events::rsvp_new() → find_events_rsvp. */
export async function findFreeTicketConflict(eventId: number, email: string) {
  const existing = await prisma.find_events_rsvp.findFirst({
    where: { event_id: eventId, email, is_deleted: 0 },
    select: { id: true },
  });
  return existing?.id ?? null;
}

/** Mirrors template/findusonweb/blocks/visitor_register_form.php's submit handler — same target
 * table (find_events_rsvp) and mostly the same field set as that legacy block form. */
export async function createFreeTicketRsvp(eventId: number, input: FreeTicketInput) {
  return prisma.find_events_rsvp.create({
    data: {
      event_id: eventId,
      first_name: input.first_name,
      last_name: input.last_name,
      name: `${input.first_name} ${input.last_name}`.trim(),
      email: input.email,
      phone: input.phone,
      workphone: input.work_phone || null,
      business: input.business || null,
      position: input.position || null,
      linkedin_user_profile: input.linkedin_profile || null,
      referral_code: input.referral_code || null,
      referral_mstr_id: input.referral_mstr_id || null,
      visitor_referrer_from: input.referrer_from || null,
      visitor_why_exhibit: input.why_exhibit || null,
      visitor_is_webinars: input.is_webinars ? 1 : 0,
      visitor_is_workshops: input.is_workshops ? 1 : 0,
      visitor_is_e_magazine: input.is_e_magazine ? 1 : 0,
      visitor_is_newsletter: input.is_newsletter ? 1 : 0,
      visitor_is_business_presentation: input.is_business_presentation ? 1 : 0,
      source: referralLabel(input.referral_mstr_id),
      description: input.interest || null,
      status: "Registered",
      ...REQUIRED_LEGACY_DEFAULTS,
    },
    select: { id: true },
  });
}

export interface VisitorLookupResult {
  found: boolean;
  name?: string;
  status?: string | null;
}

/** Passwordless "visitor login" lookup — visitors are guest RSVP rows, not find_users accounts. */
export async function lookupVisitorByEmail(eventId: number, email: string): Promise<VisitorLookupResult> {
  const visitor = await prisma.find_events_rsvp.findFirst({
    where: { event_id: eventId, email, is_deleted: 0 },
    select: { first_name: true, last_name: true, status: true },
  });

  if (!visitor) return { found: false };

  return {
    found: true,
    name: [visitor.first_name, visitor.last_name].filter(Boolean).join(" ") || undefined,
    status: visitor.status,
  };
}
