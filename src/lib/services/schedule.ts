import { prisma } from "@/lib/prisma";
import { getEventDateRange } from "@/lib/services/events";

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function datesInRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cursor <= last) {
    dates.push(dateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export interface ScheduleSlot {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  agendaName: string;
  speakerId: number | null;
  speakerName: string | null;
  speakerPosition: string | null;
  speakerBusiness: string | null;
  speakerProfilePic: string | null;
}

export interface ScheduleDay {
  date: string;
  dayTitle: string;
  dateLabel: string;
  slots: ScheduleSlot[];
}

interface RawItem {
  id: number;
  title: string;
  description: string;
  session_date: Date | null;
  start_date_time: Date;
  end_date_time: Date;
  speaker_id: number | null;
  agenda_id: number;
}

interface SpeakerInfo {
  id: number;
  name: string;
  position: string | null;
  business: string | null;
  profilePic: string | null;
}

function groupIntoDays(
  items: RawItem[],
  agendaTitleById: Map<number, string>,
  speakerById: Map<number, SpeakerInfo>,
  orderedDates: string[]
): ScheduleDay[] {
  const dayByDate = new Map<string, ScheduleDay>();

  for (const item of items) {
    const speaker = item.speaker_id ? speakerById.get(item.speaker_id) : undefined;
    if (!speaker) continue;

    const sessionDate = item.session_date ? dateKey(item.session_date) : dateKey(item.start_date_time);
    if (!dayByDate.has(sessionDate)) {
      const dayIndex = orderedDates.indexOf(sessionDate);
      dayByDate.set(sessionDate, {
        date: sessionDate,
        dayTitle: dayIndex >= 0 ? `Day ${dayIndex + 1}` : "",
        dateLabel: item.session_date
          ? item.session_date.toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })
          : "",
        slots: [],
      });
    }

    dayByDate.get(sessionDate)!.slots.push({
      id: item.id,
      title: item.title,
      description: item.description,
      startTime: item.start_date_time.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }),
      endTime: item.end_date_time.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }),
      agendaName: agendaTitleById.get(item.agenda_id) ?? "",
      speakerId: speaker.id,
      speakerName: speaker.name,
      speakerPosition: speaker.position,
      speakerBusiness: speaker.business,
      speakerProfilePic: speaker.profilePic,
    });
  }

  return [...dayByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function resolveSpeakers(speakerIds: number[]): Promise<Map<number, SpeakerInfo>> {
  if (speakerIds.length === 0) return new Map();

  const speakers = await prisma.find_speakers.findMany({
    where: { id: { in: speakerIds }, status: "active" },
    select: { id: true, name: true, position: true, business: true, profile_pic: true, listing_id: true },
  });

  const listingIds = speakers.map((s: any) => s.listing_id).filter((id: any): id is number => !!id);
  const listings =
    listingIds.length > 0
      ? await prisma.find_listings.findMany({ where: { id: { in: listingIds } }, select: { id: true, title: true } })
      : [];
  const listingTitleById = new Map<any, any>(listings.map((l: any) => [l.id, l.title]));

  return new Map(
    speakers.map((s: any) => [
      s.id,
      {
        id: s.id,
        name: s.name,
        position: s.position,
        business: s.business || (s.listing_id ? listingTitleById.get(s.listing_id) ?? null : null),
        profilePic: s.profile_pic,
      },
    ])
  );
}

/** Mirrors class_eventspeaker.php::getAllSpeakerSchedule() — the full event agenda. */
export async function getEventSchedule(eventId: number): Promise<ScheduleDay[]> {
  const rawItems = await prisma.find_event_lobby_agenda_items.findMany({
    where: { event_id: eventId, speaker_id: { not: null } },
    orderBy: [{ session_date: "asc" }, { agenda_id: "asc" }, { start_date_time: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      session_date: true,
      start_date_time: true,
      end_date_time: true,
      speaker_id: true,
      agenda_id: true,
    },
  });
  if (rawItems.length === 0) return [];

  const agendaIds = [...new Set(rawItems.map((i: any) => i.agenda_id))];
  const activeAgendas = await prisma.find_event_lobby_agenda.findMany({
    where: { id: { in: agendaIds }, status: "active" },
    select: { id: true, title: true },
  });
  const agendaTitleById = new Map<any, any>(activeAgendas.map((a: any) => [a.id, a.title]));
  const items = rawItems.filter((item: any) => agendaTitleById.has(item.agenda_id));
  if (items.length === 0) return [];

  const speakerIds: number[] = [...new Set(items.map((i: any) => i.speaker_id).filter((id: any): id is number => !!id))] as any;
  const speakerById = await resolveSpeakers(speakerIds);

  const dateRange = await getEventDateRange(eventId);
  const orderedDates = dateRange ? datesInRange(dateRange.date_start, dateRange.date_end) : [];

  return groupIntoDays(items, agendaTitleById, speakerById, orderedDates);
}

export interface AgendaVenueOption {
  id: number;
  title: string;
}

/** Active venues/agendas for an event — used to populate the speaker questionnaire's venue picker
 * with real find_event_lobby_agenda rows instead of a hardcoded list. */
export async function getActiveAgendaVenues(eventId: number): Promise<AgendaVenueOption[]> {
  return prisma.find_event_lobby_agenda.findMany({
    where: { event_id: eventId, status: "active" },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
}

/** The event's day-by-day date options (dd/mm/yyyy, matching legacy's date('d/m/Y') format)
 * for use in date pickers such as the speaker questionnaire's "preferred date" selector. */
export async function getEventDateOptions(eventId: number): Promise<string[]> {
  const range = await getEventDateRange(eventId);
  if (!range) return [];
  return datesInRange(range.date_start, range.date_end).map((key) => {
    const [y, m, d] = key.split("-");
    return `${d}/${m}/${y}`;
  });
}

/** Mirrors class_eventspeaker.php::getSpeakerSchedule() — one speaker's own session slots. */
export async function getSpeakerScheduleSlots(speakerId: number, eventId: number): Promise<ScheduleDay[]> {
  const items = await prisma.find_event_lobby_agenda_items.findMany({
    where: { speaker_id: speakerId },
    orderBy: { start_date_time: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      session_date: true,
      start_date_time: true,
      end_date_time: true,
      speaker_id: true,
      agenda_id: true,
    },
  });
  if (items.length === 0) return [];

  const agendaIds = [...new Set(items.map((i: any) => i.agenda_id))];
  const agendas = await prisma.find_event_lobby_agenda.findMany({
    where: { id: { in: agendaIds } },
    select: { id: true, title: true },
  });
  const agendaTitleById = new Map<any, any>(agendas.map((a: any) => [a.id, a.title]));

  const speakerById = await resolveSpeakers([speakerId]);

  const dateRange = await getEventDateRange(eventId);
  const orderedDates = dateRange ? datesInRange(dateRange.date_start, dateRange.date_end) : [];

  return groupIntoDays(items, agendaTitleById, speakerById, orderedDates);
}