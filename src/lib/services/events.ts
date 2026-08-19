import { prisma } from "@/lib/prisma";
import { CACHE_TAGS, cachedRead } from "@/lib/cache";

/**
 * The event's own record. Cached across requests (see src/lib/cache.ts): this is read by nearly
 * every public page, and an event's title/venue/dates change a handful of times a year at most.
 */
export const getEventById = cachedRead(
  ["events", "getEventById"],
  async function getEventById(eventId: number) {
    return prisma.find_events.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        label: true,
        venue: true,
        location: true,
        date_start: true,
        date_end: true,
        previous_event_id: true,
        hide_speaker: true,
        email: true,
        phone: true,
        color: true,
        friendly_url: true,
      },
    });
  },
  { tags: [CACHE_TAGS.event] }
);

/**
 * Resolves an event by its public slug (`.htaccess`'s `virtual-event/([^/]+)` rewrite target in
 * the legacy site) — used by the new public `/virtual-event/[slug]` lobby + login pages, which
 * only ever have the friendly_url from the route param, not the numeric id.
 */
export const getEventByFriendlyUrl = cachedRead(
  ["events", "getEventByFriendlyUrl"],
  async function getEventByFriendlyUrl(friendlyUrl: string) {
    return prisma.find_events.findFirst({
      where: { friendly_url: friendlyUrl },
      select: {
        id: true,
        title: true,
        label: true,
        venue: true,
        location: true,
        date_start: true,
        date_end: true,
        previous_event_id: true,
        hide_speaker: true,
        email: true,
        phone: true,
        color: true,
        friendly_url: true,
      },
    });
  },
  { tags: [CACHE_TAGS.event] }
);

/** find_events_dates holds the authoritative multi-day date range for an event. */
export const getEventDateRange = cachedRead(
  ["events", "getEventDateRange"],
  async function getEventDateRange(eventId: number) {
    return prisma.find_events_dates.findFirst({
      where: { event_id: eventId },
      select: { date_start: true, date_end: true },
    });
  },
  { tags: [CACHE_TAGS.event] }
);

/**
 * Mirrors class_events.php::EventUserType()'s "Organiser" branch — the event's owning user.
 *
 * NOT cached, deliberately. This is an authorisation check, and cached authorisation is how one
 * account ends up being granted another's access. It is also a single indexed lookup on a page
 * that is already behind a login, so it is not part of the public-traffic egress problem.
 */
export async function isEventOrganiser(eventId: number, userId: number) {
  // Demo organiser account -30 always has organiser access
  if (userId === -30) return true;

  const event = await prisma.find_events.findUnique({
    where: { id: eventId },
    select: { user_id: true },
  });
  return event?.user_id === userId;
}
