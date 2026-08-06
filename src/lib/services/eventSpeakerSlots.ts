import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { AssignSpeakerSlotInput } from "@/lib/validations/eventSpeakerSlot";

export interface SpeakerSlotRow {
  id: number;
  sessionDate: Date | null;
  startDateTime: Date;
  endDateTime: Date;
  roomName: string | null;
  title: string;
  speakerId: number | null;
  speakerName: string | null;
  speakerStatus: string | null;
}

export interface AssignableSpeaker {
  id: number;
  name: string;
  status: string;
}

/** Mirrors members/manage_speaker_slots.php's list — organiser-only view of the event's agenda
 * slots and which ones have a speaker assigned. Slots themselves come from the lobby/agenda
 * builder (out of scope here); this page only assigns/unassigns a speaker to existing slots. */
export async function getSpeakerSlots(context: EventMemberContext): Promise<SpeakerSlotRow[]> {
  if (context.role !== "organiser") return [];

  const items = await prisma.find_event_lobby_agenda_items.findMany({
    where: { event_id: context.eventId },
    orderBy: [{ session_date: "asc" }, { start_date_time: "asc" }],
    select: {
      id: true,
      session_date: true,
      start_date_time: true,
      end_date_time: true,
      title: true,
      agenda_id: true,
      speaker_id: true,
      speaker_name: true,
    },
  });
  if (items.length === 0) return [];

  const agendaIds = [...new Set(items.map((i: any) => i.agenda_id).filter(Boolean))];
  const speakerIds = [...new Set(items.map((i: any) => i.speaker_id).filter((v: any): v is number => !!v))];

  const [agendas, speakers] = await Promise.all([
    agendaIds.length > 0
      ? prisma.find_event_lobby_agenda.findMany({ where: { id: { in: agendaIds } }, select: { id: true, title: true } })
      : [],
    speakerIds.length > 0
      ? prisma.find_speakers.findMany({ where: { id: { in: speakerIds } }, select: { id: true, status: true } })
      : [],
  ]);
  const agendaTitleById = new Map<any, any>(agendas.map((a: any) => [a.id, a.title]));
  const speakerStatusById = new Map<any, any>(speakers.map((s: any) => [s.id, s.status]));

  return items.map((i: any) => ({
    id: i.id,
    sessionDate: i.session_date,
    startDateTime: i.start_date_time,
    endDateTime: i.end_date_time,
    roomName: i.agenda_id ? agendaTitleById.get(i.agenda_id) ?? null : null,
    title: i.title,
    speakerId: i.speaker_id,
    speakerName: i.speaker_name,
    speakerStatus: i.speaker_id ? speakerStatusById.get(i.speaker_id) ?? null : null,
  }));
}

export async function getAssignableSpeakers(context: EventMemberContext): Promise<AssignableSpeaker[]> {
  if (context.role !== "organiser") return [];
  const speakers = await prisma.find_speakers.findMany({
    where: { event_id: context.eventId, status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true },
  });
  return speakers.map((s: any) => ({ id: s.id, name: s.name, status: s.status }));
}

export async function assignSpeakerSlot(context: EventMemberContext, slotId: number, input: AssignSpeakerSlotInput) {
  if (context.role !== "organiser") return { ok: false as const, error: "Only the event organiser can assign slots." };

  const speaker = await prisma.find_speakers.findFirst({
    where: { id: input.speaker_id, event_id: context.eventId },
    select: { id: true, name: true },
  });
  if (!speaker) return { ok: false as const, error: "That speaker could not be found for this event." };

  const slot = await prisma.find_event_lobby_agenda_items.findFirst({
    where: { id: slotId, event_id: context.eventId },
    select: { id: true },
  });
  if (!slot) return { ok: false as const, error: "That slot could not be found." };

  await prisma.find_event_lobby_agenda_items.update({
    where: { id: slotId },
    data: {
      speaker_id: speaker.id,
      speaker_name: speaker.name,
      title: input.title,
      description: input.topic_description || "",
    },
  });
  await prisma.find_speakers.update({
    where: { id: speaker.id },
    data: { topic_description: input.topic_description || null },
  });

  return { ok: true as const };
}

export async function removeSpeakerSlot(context: EventMemberContext, slotId: number) {
  if (context.role !== "organiser") return { ok: false as const, error: "Only the event organiser can remove slot assignments." };

  const result = await prisma.find_event_lobby_agenda_items.updateMany({
    where: { id: slotId, event_id: context.eventId },
    data: { speaker_id: null, speaker_name: null },
  });
  if (result.count === 0) return { ok: false as const, error: "That slot could not be found." };
  return { ok: true as const };
}
