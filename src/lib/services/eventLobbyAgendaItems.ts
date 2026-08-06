import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventLobbyAgendaTrackInput } from "@/lib/validations/eventLobbyAgendaTrack";
import type { EventLobbyAgendaItemInput } from "@/lib/validations/eventLobbyAgendaItem";

export interface AgendaTrackRow {
  id: number;
  title: string;
  description: string;
  agendaType: string | null;
  status: string;
}

const TRACK_SELECT = {
  id: true,
  title: true,
  description: true,
  agenda_type: true,
  status: true,
} as const;

function toTrackRow(row: any): AgendaTrackRow {
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    agendaType: row.agenda_type,
    status: row.status ?? "active",
  };
}

/** Mirrors the track/hall picker in members/event_lobby_agenda_items.php — the tracks
 * belonging to this event's primary lobby layout. */
export async function getAgendaTracks(context: EventMemberContext, eventLayoutId: number): Promise<AgendaTrackRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_event_lobby_agenda.findMany({
    where: { event_id: context.eventId, event_layout_id: eventLayoutId },
    orderBy: { title: "asc" },
    select: TRACK_SELECT,
  });
  return rows.map(toTrackRow);
}

export async function createAgendaTrack(context: EventMemberContext, eventLayoutId: number, input: EventLobbyAgendaTrackInput) {
  if (context.role !== "organiser") return null;
  return prisma.find_event_lobby_agenda.create({
    data: {
      event_id: context.eventId,
      event_layout_id: eventLayoutId,
      user_id: context.userId,
      title: input.title,
      description: input.description || "",
      agenda_type: input.agenda_type || null,
      status: input.status,
      updated_on: new Date(),
    },
    select: { id: true },
  });
}

export async function updateAgendaTrack(context: EventMemberContext, id: number, input: EventLobbyAgendaTrackInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_lobby_agenda.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      title: input.title,
      description: input.description || "",
      agenda_type: input.agenda_type || null,
      status: input.status,
      updated_on: new Date(),
    },
  });
}

export async function deleteAgendaTrack(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  // Sessions under this track would otherwise be orphaned (agenda_id is required, not nullable).
  const itemCount = await prisma.find_event_lobby_agenda_items.count({ where: { agenda_id: id, event_id: context.eventId } });
  if (itemCount > 0) return { count: 0, error: "blocked" as const };
  return prisma.find_event_lobby_agenda.deleteMany({ where: { id, event_id: context.eventId } });
}

export interface AgendaItemRow {
  id: number;
  agendaId: number;
  agendaTitle: string;
  title: string;
  description: string;
  sessionDate: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  speakerId: number | null;
  speakerName: string | null;
  videoType: string;
  meetingId: string | null;
  meetingPassword: string | null;
  videoLink: string | null;
  status: string;
  tentativeSchedule: boolean;
}

const ITEM_SELECT = {
  id: true,
  agenda_id: true,
  title: true,
  description: true,
  session_date: true,
  start_date_time: true,
  end_date_time: true,
  speaker_id: true,
  speaker_name: true,
  video_type: true,
  meeting_id: true,
  meeting_password: true,
  video_link: true,
  status: true,
  tentative_schedule: true,
} as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeKey(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toItemRow(row: any, agendaTitleById: Map<number, string>): AgendaItemRow {
  return {
    id: row.id,
    agendaId: row.agenda_id,
    agendaTitle: agendaTitleById.get(row.agenda_id) ?? "Untitled Track",
    title: row.title ?? "",
    description: row.description ?? "",
    sessionDate: row.session_date ? toDateKey(row.session_date) : toDateKey(row.start_date_time),
    startTime: toTimeKey(row.start_date_time),
    endTime: toTimeKey(row.end_date_time),
    speakerId: row.speaker_id,
    speakerName: row.speaker_name,
    videoType: row.video_type ?? "",
    meetingId: row.meeting_id,
    meetingPassword: row.meeting_password,
    videoLink: row.video_link,
    status: row.status ?? "active",
    tentativeSchedule: !!row.tentative_schedule,
  };
}

/** Mirrors members/event_lobby_agenda_items.php's list — every scheduled session across this
 * lobby's tracks, for this organiser's event. */
export async function getAgendaItems(context: EventMemberContext, eventLayoutId: number): Promise<AgendaItemRow[]> {
  if (context.role !== "organiser") return [];

  const tracks = await prisma.find_event_lobby_agenda.findMany({
    where: { event_id: context.eventId, event_layout_id: eventLayoutId },
    select: { id: true, title: true },
  });
  if (tracks.length === 0) return [];

  const agendaTitleById = new Map<number, string>(tracks.map((t: any) => [t.id, t.title ?? "Untitled Track"]));
  const trackIds = tracks.map((t: any) => t.id);

  const rows = await prisma.find_event_lobby_agenda_items.findMany({
    where: { event_id: context.eventId, agenda_id: { in: trackIds } },
    orderBy: [{ session_date: "asc" }, { start_date_time: "asc" }],
    select: ITEM_SELECT,
  });

  return rows.map((row: any) => toItemRow(row, agendaTitleById));
}

function combineDateTime(sessionDate: string, time: string): Date {
  return new Date(`${sessionDate}T${time}:00`);
}

/**
 * `layout_type_setup_id` and `linked_profile_user_id` are legacy NOT NULL columns on
 * find_event_lobby_agenda_items with no dedicated selector surfaced on this page (they aren't
 * referenced anywhere else in the app either). We default them to the lobby's own layout id and
 * the organiser's user id respectively, rather than leaving the insert to fail on a required
 * column with nothing meaningful to put there yet.
 */
export async function createAgendaItem(
  context: EventMemberContext,
  eventLayoutId: number,
  input: EventLobbyAgendaItemInput
) {
  if (context.role !== "organiser") return null;
  return prisma.find_event_lobby_agenda_items.create({
    data: {
      event_id: context.eventId,
      agenda_id: input.agenda_id,
      title: input.title,
      description: input.description || "",
      session_date: new Date(`${input.session_date}T00:00:00`),
      start_date_time: combineDateTime(input.session_date, input.start_time),
      end_date_time: combineDateTime(input.session_date, input.end_time),
      speaker_id: input.speaker_id || null,
      speaker_name: input.speaker_name || null,
      video_type: input.video_type || null,
      meeting_id: input.meeting_id || null,
      meeting_password: input.meeting_password || null,
      video_link: input.video_link || null,
      status: input.status,
      tentative_schedule: input.tentative_schedule,
      layout_type_setup_id: eventLayoutId,
      linked_profile_user_id: context.userId,
      user_id: context.userId,
      updated_on: new Date(),
    },
    select: { id: true },
  });
}

export async function updateAgendaItem(context: EventMemberContext, id: number, input: EventLobbyAgendaItemInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_lobby_agenda_items.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      agenda_id: input.agenda_id,
      title: input.title,
      description: input.description || "",
      session_date: new Date(`${input.session_date}T00:00:00`),
      start_date_time: combineDateTime(input.session_date, input.start_time),
      end_date_time: combineDateTime(input.session_date, input.end_time),
      speaker_id: input.speaker_id || null,
      speaker_name: input.speaker_name || null,
      video_type: input.video_type || null,
      meeting_id: input.meeting_id || null,
      meeting_password: input.meeting_password || null,
      video_link: input.video_link || null,
      status: input.status,
      tentative_schedule: input.tentative_schedule,
      updated_on: new Date(),
    },
  });
}

export async function deleteAgendaItem(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_lobby_agenda_items.deleteMany({ where: { id, event_id: context.eventId } });
}

export interface AssignableSpeakerOption {
  id: number;
  name: string;
}

/** Active speakers for this event, for the optional speaker picker on a session. */
export async function getAgendaAssignableSpeakers(context: EventMemberContext): Promise<AssignableSpeakerOption[]> {
  if (context.role !== "organiser") return [];
  const speakers = await prisma.find_speakers.findMany({
    where: { event_id: context.eventId, status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return speakers.map((s: any) => ({ id: s.id, name: s.name }));
}
