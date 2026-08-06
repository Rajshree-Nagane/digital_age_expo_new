import { prisma } from "@/lib/prisma";
import { getSetting, setSetting, defineSetting } from "@/lib/cp/settings/settingsRepository";
import { ACTIVE_EVENT_SETTING_VARNAME } from "@/lib/site-config";

/**
 * find_events has 200+ columns (feature flags for every era of this product) — this CP
 * module deliberately surfaces only the "core" fields an admin actually edits day-to-day
 * (title/description/venue/location/dates/contact/status), not every legacy flag. Extending
 * the edit form to cover more fields later is additive (add inputs + extend the select/data
 * in this file) and doesn't require touching this shape.
 */
const CORE_FIELDS = {
  id: true,
  title: true,
  subtitle: true,
  friendly_url: true,
  status: true,
  description_short: true,
  description: true,
  venue: true,
  location: true,
  date_start: true,
  date_end: true,
  contact_name: true,
  email: true,
  phone: true,
  website: true,
  previous_event_id: true,
  next_event_id: true,
} as const;

const PAGE_SIZE = 20;

export async function listEvents(params: { page?: number; search?: string }) {
  const page = Math.max(1, params.page ?? 1);
  const search = params.search?.trim();

  // find_events.domain_id is an oddly-typed free-text column (String, not the Int domain_id
  // find_users uses) whose exact convention isn't verifiable from here without live data —
  // rather than risk hiding real events behind a guessed filter, this lists across all
  // domains and relies on search/status instead.
  const where = search
    ? {
        OR: [
          { title: { contains: search } },
          { friendly_url: { contains: search } },
          { venue: { contains: search } },
        ],
      }
    : {};

  const [events, total] = await Promise.all([
    prisma.find_events.findMany({
      where,
      select: CORE_FIELDS,
      orderBy: { date_start: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.find_events.count({ where }),
  ]);

  return { events, total, page, pageSize: PAGE_SIZE };
}

export async function getEventForEdit(id: number) {
  return prisma.find_events.findUnique({ where: { id }, select: CORE_FIELDS });
}

export interface EventCoreInput {
  title: string;
  subtitle: string;
  friendly_url: string;
  description_short: string;
  description: string;
  venue: string;
  location: string;
  // Both nullable here (not the bare `Date` this used to require) — a blank date input from
  // the edit form previously became `new Date("")` (an Invalid Date), which crashed later when
  // Prisma's own query serializer tried to call .toISOString() on it. null now means "the form
  // didn't send a usable date"; see actions.ts's parseOptionalDate().
  date_start: Date | null;
  date_end: Date | null;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
}

export async function updateEventCore(id: number, input: EventCoreInput): Promise<void> {
  const { date_start, date_end, ...rest } = input;

  await prisma.find_events.update({
    where: { id },
    data: {
      ...rest,
      // date_start is a required (NOT NULL) column — only overwrite it when the form actually
      // gave us a parseable date. A blank/invalid submission leaves the stored value untouched
      // instead of writing an Invalid Date or a NULL the DB would reject.
      ...(date_start ? { date_start } : {}),
      // date_end IS nullable — a blank End Date field is treated as a deliberate "no end date".
      date_end,
    },
  });

  // find_events_dates mirrors date_start/date_end on a separate per-event row (used by
  // "events upcoming" style queries elsewhere) — keep both in sync on every edit.
  await prisma.find_events_dates
    .updateMany({
      where: { event_id: id },
      data: { ...(date_start ? { date_start } : {}), date_end },
    })
    .catch(() => undefined); // no matching find_events_dates row is not fatal — the core find_events row is still updated
}

/** Free text, not a rigid enum — this project's real allowed values aren't verifiable from here (no DB access), so this doesn't force a guessed dropdown that could exclude a real legacy status. */
export async function setEventStatus(id: number, status: string): Promise<void> {
  await prisma.find_events.update({ where: { id }, data: { status } });
}

export interface DuplicateEventInput {
  title: string;
  friendly_url: string;
  date_start: Date;
  date_end: Date;
}

/**
 * Mirrors copyEvent() in src/lib/services/eventDetails.ts (the member-portal "Copy Event"
 * button's logic) field-for-field, minus its `context.role !== "organiser"` gate — a CP admin
 * duplicating an event is authorized by admin_events_edit (see events/actions.ts), not by
 * being that event's member-portal organiser.
 */
export async function duplicateEvent(sourceEventId: number, input: DuplicateEventInput) {
  const source = await prisma.find_events.findUnique({ where: { id: sourceEventId } });
  if (!source) throw new Error("Source event not found.");

  const { id: _sourceId, ...rest } = source;
  const now = new Date();

  const newEvent = await prisma.find_events.create({
    data: {
      ...rest,
      title: input.title,
      friendly_url: input.friendly_url,
      date_start: input.date_start,
      date_end: input.date_end,
      image_extension: source.image_extension,
      image_file_name: source.image_file_name,
      date: now,
      date_update: now,
      created_at: now,
      updated_at: now,
      impressions: 0,
      expired_sent: false,
      previous_event_id: source.id,
      next_event_id: null,
    },
    select: { id: true, title: true, friendly_url: true },
  });

  await prisma.find_events.update({ where: { id: source.id }, data: { next_event_id: newEvent.id } });

  const categories = await prisma.$queryRaw<{ category_id: number }[]>`
    SELECT category_id FROM find_events_categories_lookup WHERE event_id = ${source.id}
  `;
  for (const { category_id } of categories) {
    await prisma.$executeRaw`
      INSERT INTO find_events_categories_lookup (category_id, event_id) VALUES (${category_id}, ${newEvent.id})
    `;
  }

  await prisma.find_events_dates.create({
    data: { event_id: newEvent.id, date_start: input.date_start, date_end: input.date_end, rsvp_reminder_sent: false },
  });

  return newEvent;
}

/**
 * This is now the SINGLE SOURCE OF TRUTH for which event's data the public/member site shows —
 * both Events Management's "Mark Active" button and General Settings' "Event" dropdown write
 * here, and src/lib/services/domain.ts's getDomain() reads this exact varname (independently,
 * via its own $queryRaw, to avoid the public site importing this CP module) to resolve
 * event_id, falling back to DEFAULT_EVENT_ID (site-config.ts) only when this setting is unset
 * or unreadable. This used to be CP-only bookkeeping with no effect on the live site — see the
 * git history on this file/getDomain() if you need the old behavior back.
 */
export async function getActiveEventId(): Promise<number | null> {
  const value = await getSetting(ACTIVE_EVENT_SETTING_VARNAME);
  return value ? Number(value) : null;
}

export async function setActiveEventId(eventId: number): Promise<void> {
  await defineSetting({ varname: ACTIVE_EVENT_SETTING_VARNAME, grouptitle: "events", value: String(eventId) });
  await setSetting(ACTIVE_EVENT_SETTING_VARNAME, String(eventId));
}

/**
 * Upcoming-events list for the General Settings "Event" dropdown — "upcoming" means the event
 * hasn't fully ended yet: date_end in the future, OR (no date_end at all AND date_start hasn't
 * passed). Past events (fully ended) are excluded per the dropdown's purpose — picking the site's
 * current/next event, not browsing history. Ordered soonest-first.
 */
export async function listUpcomingEventsForDropdown() {
  const now = new Date();
  return prisma.find_events.findMany({
    where: {
      OR: [{ date_end: { gte: now } }, { AND: [{ date_end: null }, { date_start: { gte: now } }] }],
    },
    select: { id: true, title: true, date_start: true },
    orderBy: { date_start: "asc" },
  });
}
