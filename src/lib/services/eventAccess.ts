import { prisma } from "@/lib/prisma";
import { isEventOrganiser } from "@/lib/services/events";

export type EventRole = "organiser" | "exhibitor" | "speaker" | "sponsor" | "visitor";

export interface EventMemberContext {
  role: EventRole;
  eventId: number;
  userId: number;
  userEmail?: string;
  /** The member's own find_event_exhibitor row, when role is "exhibitor". */
  exhibitorId?: number;
  listingId?: number | null;
  /** The member's own find_speakers row, when role is "speaker". */
  speakerId?: number;
  /** The member's own find_event_sponsorer row, when role is "sponsor". */
  sponsorId?: number;
}

/**
 * Mirrors class_events.php::EventUserType() — resolves what relationship the signed-in
 * user has to this event (organiser, or a registered exhibitor/speaker/sponsor "member").
 * Returns null if the user has no relationship to the event at all.
 */
export async function getEventMemberContext(eventId: number, userId: number): Promise<EventMemberContext | null> {
  if (userId === -30 || (await isEventOrganiser(eventId, userId))) {
    return { role: "organiser", eventId, userId };
  }

  // Demo accounts (see verifyMemberCredentials) don't have real rows in the legacy
  // tables — give them a synthetic context so the demo experience isn't a dead end.
  if (userId === -10) {
    return { role: "exhibitor", eventId, userId, exhibitorId: -10, listingId: null };
  }
  if (userId === -20) {
    return { role: "speaker", eventId, userId, speakerId: -20 };
  }
  if (userId === -40) {
    return { role: "visitor", eventId, userId };
  }

  const exhibitor = await prisma.find_event_exhibitor.findFirst({
    where: { event_id: eventId, user_id: userId },
    select: { id: true, listing_id: true },
  });
  if (exhibitor) {
    return { role: "exhibitor", eventId, userId, exhibitorId: exhibitor.id, listingId: exhibitor.listing_id };
  }

  const speaker = await prisma.find_speakers.findFirst({
    where: { event_id: eventId, user_id: userId },
    select: { id: true },
  });
  if (speaker) {
    return { role: "speaker", eventId, userId, speakerId: speaker.id };
  }

  const sponsor = await prisma.find_event_sponsorer.findFirst({
    where: { event_id: eventId, user_id: userId },
    select: { id: true },
  });
  if (sponsor) {
    return { role: "sponsor", eventId, userId, sponsorId: sponsor.id };
  }

  // Fallback context for authenticated members without specific DB role rows
  return { role: "visitor", eventId, userId };
}

const ROLE_LABEL: Record<EventRole, string> = {
  organiser: "Organiser",
  exhibitor: "Exhibitor",
  speaker: "Speaker",
  sponsor: "Sponsor",
  visitor: "Visitor",
};

export function roleLabel(role: EventRole): string {
  return ROLE_LABEL[role];
}
