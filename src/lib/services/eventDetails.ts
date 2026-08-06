import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventDetailsInput } from "@/lib/validations/eventDetails";
import type { EventCopyInput } from "@/lib/validations/eventCopy";

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export interface EventDetails {
  id: number;
  title: string;
  date_start: string;
  date_end: string;
  venue: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  contact_name: string;
  contact_address: string;
  description_short: string;
  description: string;
  category_description: string;
  friendly_url: string;
  meta_title: string;
  meta_keywords: string;
  meta_description: string;
  keywords: string;
  facebook_url: string;
  facebook_group_url: string;
  twitter_url: string;
  linkedin_url: string;
  linkedin_group_url: string;
  instagram_url: string;
  youtube_channel_url: string;
  zoom_url: string;
  hide_home: boolean;
  hide_exhibitor: boolean;
  hide_sponsor: boolean;
  hide_speaker: boolean;
  hide_visitor: boolean;
  hide_speaker_home: boolean;
  hide_eventimage: boolean;
  hide_eventvideo: boolean;
  expected_no_of_exhibitor: number | null;
  expected_no_of_exhibitor_display_text: string;
  expected_no_of_investor: number | null;
  expected_no_of_investor_display_text: string;
  expected_no_of_workshop_panel: number | null;
  expected_no_of_workshop_panel_display_text: string;
  expected_no_of_countries: number | null;
  expected_no_of_countries_display_text: string;
}

const SELECT_FIELDS = {
  id: true,
  title: true,
  date_start: true,
  date_end: true,
  venue: true,
  location: true,
  website: true,
  email: true,
  phone: true,
  contact_name: true,
  contact_address: true,
  description_short: true,
  description: true,
  category_description: true,
  friendly_url: true,
  meta_title: true,
  meta_keywords: true,
  meta_description: true,
  keywords: true,
  facebook_url: true,
  facebook_group_url: true,
  twitter_url: true,
  linkedin_url: true,
  linkedin_group_url: true,
  instagram_url: true,
  youtube_channel_url: true,
  zoom_url: true,
  hide_home: true,
  hide_exhibitor: true,
  hide_sponsor: true,
  hide_speaker: true,
  hide_visitor: true,
  hide_speaker_home: true,
  hide_eventimage: true,
  hide_eventvideo: true,
  expected_no_of_exhibitor: true,
  expected_no_of_exhibitor_display_text: true,
  expected_no_of_investor: true,
  expected_no_of_investor_display_text: true,
  expected_no_of_workshop_panel: true,
  expected_no_of_workshop_panel_display_text: true,
  expected_no_of_countries: true,
  expected_no_of_countries_display_text: true,
} as const;

/** Mirrors members/user_events.php?action=edit's core-event fieldset (see event_details scoping). Organiser-only. */
export async function getEventDetails(context: EventMemberContext): Promise<EventDetails | null> {
  if (context.role !== "organiser") return null;

  const row = await prisma.find_events.findUnique({
    where: { id: context.eventId },
    select: SELECT_FIELDS,
  });
  if (!row) return null;

  return {
    id: row.id,
    title: row.title ?? "",
    date_start: toDateInputValue(row.date_start),
    date_end: toDateInputValue(row.date_end),
    venue: row.venue ?? "",
    location: row.location ?? "",
    website: row.website ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    contact_name: row.contact_name ?? "",
    contact_address: row.contact_address ?? "",
    description_short: row.description_short ?? "",
    description: row.description ?? "",
    category_description: row.category_description ?? "",
    friendly_url: row.friendly_url ?? "",
    meta_title: row.meta_title ?? "",
    meta_keywords: row.meta_keywords ?? "",
    meta_description: row.meta_description ?? "",
    keywords: row.keywords ?? "",
    facebook_url: row.facebook_url ?? "",
    facebook_group_url: row.facebook_group_url ?? "",
    twitter_url: row.twitter_url ?? "",
    linkedin_url: row.linkedin_url ?? "",
    linkedin_group_url: row.linkedin_group_url ?? "",
    instagram_url: row.instagram_url ?? "",
    youtube_channel_url: row.youtube_channel_url ?? "",
    zoom_url: row.zoom_url ?? "",
    hide_home: !!row.hide_home,
    hide_exhibitor: !!row.hide_exhibitor,
    hide_sponsor: !!row.hide_sponsor,
    hide_speaker: !!row.hide_speaker,
    hide_visitor: !!row.hide_visitor,
    hide_speaker_home: !!row.hide_speaker_home,
    hide_eventimage: !!row.hide_eventimage,
    hide_eventvideo: !!row.hide_eventvideo,
    expected_no_of_exhibitor: row.expected_no_of_exhibitor,
    expected_no_of_exhibitor_display_text: row.expected_no_of_exhibitor_display_text ?? "",
    expected_no_of_investor: row.expected_no_of_investor,
    expected_no_of_investor_display_text: row.expected_no_of_investor_display_text ?? "",
    expected_no_of_workshop_panel: row.expected_no_of_workshop_panel,
    expected_no_of_workshop_panel_display_text: row.expected_no_of_workshop_panel_display_text ?? "",
    expected_no_of_countries: row.expected_no_of_countries,
    expected_no_of_countries_display_text: row.expected_no_of_countries_display_text ?? "",
  };
}

/** Mirrors members/user_events.php's `elseif($_GET['action'] == 'edit')` update branch, scoped to the fields this form manages. */
export async function updateEventDetails(context: EventMemberContext, input: EventDetailsInput) {
  if (context.role !== "organiser") {
    throw new Error("Only the event organiser can edit event details.");
  }

  return prisma.find_events.update({
    where: { id: context.eventId },
    data: {
      title: input.title,
      date_start: new Date(input.date_start),
      date_end: input.date_end ? new Date(input.date_end) : null,
      venue: input.venue || "",
      location: input.location || "",
      website: input.website || "",
      email: input.email || "",
      phone: input.phone || "",
      contact_name: input.contact_name || "",
      contact_address: input.contact_address || "",
      description_short: input.description_short || "",
      description: input.description || "",
      category_description: input.category_description || "",
      ...(input.friendly_url ? { friendly_url: input.friendly_url } : {}),
      meta_title: input.meta_title || "",
      meta_keywords: input.meta_keywords || "",
      meta_description: input.meta_description || "",
      keywords: input.keywords || "",
      facebook_url: input.facebook_url || "",
      facebook_group_url: input.facebook_group_url || "",
      twitter_url: input.twitter_url || "",
      linkedin_url: input.linkedin_url || "",
      linkedin_group_url: input.linkedin_group_url || "",
      instagram_url: input.instagram_url || "",
      youtube_channel_url: input.youtube_channel_url || "",
      zoom_url: input.zoom_url || "",
      hide_home: input.hide_home ? 1 : 0,
      hide_exhibitor: input.hide_exhibitor,
      hide_sponsor: input.hide_sponsor,
      hide_speaker: input.hide_speaker,
      hide_visitor: input.hide_visitor,
      hide_speaker_home: input.hide_speaker_home ? 1 : 0,
      hide_eventimage: input.hide_eventimage ? 1 : 0,
      hide_eventvideo: input.hide_eventvideo ? 1 : 0,
      expected_no_of_exhibitor: input.expected_no_of_exhibitor ?? null,
      expected_no_of_exhibitor_display_text: input.expected_no_of_exhibitor_display_text || "",
      expected_no_of_investor: input.expected_no_of_investor ?? null,
      expected_no_of_investor_display_text: input.expected_no_of_investor_display_text || "",
      expected_no_of_workshop_panel: input.expected_no_of_workshop_panel ?? null,
      expected_no_of_workshop_panel_display_text: input.expected_no_of_workshop_panel_display_text || "",
      expected_no_of_countries: input.expected_no_of_countries ?? null,
      expected_no_of_countries_display_text: input.expected_no_of_countries_display_text || "",
      date_update: new Date(),
    },
    select: { id: true },
  });
}

/**
 * Mirrors members/user_events.php's Copy Event submit handler (the `$copyform->wasSubmitted(...)`
 * branch, ~line 363-403): duplicates the current event into a brand new `find_events` row.
 *
 * The legacy INSERT only ever listed a fixed subset of columns and relied on MySQL silently
 * filling every other NOT NULL column (subtitle, location_id, event_brite_url, label,
 * ceremony_date, created_at, updated_at, hide_eventimage, hide_eventvideo, ...) with blank/zero
 * defaults — that's non-strict-mode MySQL behavior, not something Prisma will do for us. Instead
 * this copies the *entire* source row (every column) and overrides only the fields the modal
 * actually collects, so nothing ends up silently blank.
 *
 * previous_event_id / next_event_id link the two editions together in both directions — the
 * same chain find_speakers.previous_event_id already rides on for the "previous speakers"
 * section (see eventAccess.ts / view_speaker page), so a copied event automatically gets that
 * feature for free.
 */
export async function copyEvent(context: EventMemberContext, input: EventCopyInput) {
  if (context.role !== "organiser") {
    throw new Error("Only the event organiser can copy this event.");
  }

  const source = await prisma.find_events.findUnique({ where: { id: context.eventId } });
  if (!source) {
    throw new Error("Source event not found.");
  }

  const { id: _sourceId, ...rest } = source;
  const now = new Date();
  const dateStart = new Date(input.date_start);
  const dateEnd = new Date(input.date_end);

  const newEvent = await prisma.find_events.create({
    data: {
      ...rest,
      title: input.title,
      friendly_url: input.friendly_url,
      date_start: dateStart,
      date_end: dateEnd,
      // No new image yet — carries the source event's image forward until/unless the caller
      // uploads a new one via setEventImage() once the new row's id is known.
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

  // Keep the two editions linked from both directions (source -> next, copy -> previous).
  await prisma.find_events.update({
    where: { id: source.id },
    data: { next_event_id: newEvent.id },
  });

  // find_events_categories_lookup has no primary key, so Prisma can't generate a client
  // delegate for it (@@ignore in schema.prisma) — same reason getPublicationEventIds() in
  // userDashboard.ts reads it via $queryRaw instead of prisma.find_events_categories_lookup.
  const categories = await prisma.$queryRaw<{ category_id: number }[]>`
    SELECT category_id FROM find_events_categories_lookup WHERE event_id = ${source.id}
  `;
  for (const { category_id } of categories) {
    await prisma.$executeRaw`
      INSERT INTO find_events_categories_lookup (category_id, event_id) VALUES (${category_id}, ${newEvent.id})
    `;
  }

  await prisma.find_events_dates.create({
    data: {
      event_id: newEvent.id,
      date_start: dateStart,
      date_end: dateEnd,
      rsvp_reminder_sent: false,
    },
  });

  return newEvent;
}

/** Attaches a freshly-uploaded image to an event once its id is known (see
 * app/api/members/event-details/copy/route.ts — the file is written to disk keyed by the new
 * event's id, mirroring how setLeadershipBoardImage() is called after leadership-board/upload
 * writes its file). */
export async function setEventImage(eventId: number, extension: string, filename: string) {
  return prisma.find_events.update({
    where: { id: eventId },
    data: { image_extension: extension, image_file_name: filename },
    select: { id: true },
  });
}
