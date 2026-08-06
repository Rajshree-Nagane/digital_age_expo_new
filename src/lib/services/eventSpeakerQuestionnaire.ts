import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventSpeakerQuestionnaireInput } from "@/lib/validations/eventSpeakerQuestionnaire";

export interface QuestionnaireRow {
  id: number;
  eventId: number;
  userId: number | null;
  listingId: number | null;
  agendaId: number | null;
  firstName: string | null;
  lastName: string | null;
  name: string;
  title: string | null;
  description: string | null;
  topicDescription: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  profilePic: string;
  status: string;
  email: string | null;
  phone: string | null;
  workPhone: string | null;
  isBusinessSpeaker: boolean;
  isKeynoteSpeaker: boolean;
  isWebinarSpeaker: boolean;
  isSeminarSpeaker: boolean;
  isLiveWorkshopSpeaker: boolean;
  isVipSessionSpeaker: boolean;
  speakerGroup: string | null;
  speakerKeyword: string | null;
  talkDuration: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  conductWorkshop: boolean;
  workshopTopic: string | null;
  workshopDuration: string | null;
  workshopPreferredDate: string | null;
  workshopPreferredTime: string | null;
  workshopDescription: string | null;
  createdOn: string | null;
}

export interface QuestionnaireStats {
  total: number;
  workshopsRequested: number;
  keynotes: number;
  active: number;
  pending: number;
}

function formatDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  try {
    return new Date(d).toISOString().split("T")[0];
  } catch {
    return null;
  }
}

function formatTime(d: Date | null | undefined): string | null {
  if (!d) return null;
  try {
    const iso = new Date(d).toISOString();
    return iso.split("T")[1]?.slice(0, 5) || null;
  } catch {
    return null;
  }
}

function toRow(q: any): QuestionnaireRow {
  return {
    id: q.id,
    eventId: q.event_id,
    userId: q.user_id,
    listingId: q.listing_id,
    agendaId: q.agenda_id,
    firstName: q.first_name,
    lastName: q.last_name,
    name: q.name,
    title: q.title,
    description: q.description,
    topicDescription: q.topic_description,
    date: formatDate(q.date),
    startTime: formatTime(q.start_time),
    endTime: formatTime(q.end_time),
    profilePic: q.profile_pic || "",
    status: q.status || "active",
    email: q.email,
    phone: q.phone,
    workPhone: q.work_phone,
    isBusinessSpeaker: Boolean(q.is_business_speaker),
    isKeynoteSpeaker: Boolean(q.is_keynote_speaker),
    isWebinarSpeaker: Boolean(q.is_webinar_speaker),
    isSeminarSpeaker: Boolean(q.is_seminar_speaker),
    isLiveWorkshopSpeaker: Boolean(q.is_live_worksop_speaker),
    isVipSessionSpeaker: Boolean(q.is_vip_session_speaker),
    speakerGroup: q.speaker_group,
    speakerKeyword: q.speaker_keyword,
    talkDuration: q.talk_duration,
    preferredDate: formatDate(q.preferred_date),
    preferredTime: formatTime(q.preferred_time) || (q.preferred_time ? String(q.preferred_time) : null),
    conductWorkshop: Boolean(q.conduct_workshop),
    workshopTopic: q.workshop_topic,
    workshopDuration: q.workshop_duration,
    workshopPreferredDate: q.workshop_preferred_date,
    workshopPreferredTime: q.workshop_preferred_time,
    workshopDescription: q.workshop_description,
    createdOn: formatDate(q.created_on),
  };
}

export async function getSpeakerQuestionnaires(
  context: EventMemberContext,
  statusFilter?: string
): Promise<QuestionnaireRow[]> {
  const whereClause: any = { event_id: context.eventId };

  if (context.role !== "organiser") {
    whereClause.OR = [
      { user_id: Number(context.userId) || -1 },
      { email: context.userEmail || "" },
    ];
  }

  if (statusFilter && ["active", "pending", "reject"].includes(statusFilter)) {
    whereClause.status = statusFilter;
  }

  const rows = await prisma.find_speakers_questions.findMany({
    where: whereClause,
    orderBy: { id: "desc" },
  });

  return rows.map(toRow);
}

export async function getQuestionnaireStats(context: EventMemberContext): Promise<QuestionnaireStats> {
  const whereClause: any = { event_id: context.eventId };

  if (context.role !== "organiser") {
    whereClause.OR = [
      { user_id: Number(context.userId) || -1 },
      { email: context.userEmail || "" },
    ];
  }

  const rows = await prisma.find_speakers_questions.findMany({
    where: whereClause,
    select: {
      status: true,
      conduct_workshop: true,
      is_keynote_speaker: true,
    },
  });

  const stats: QuestionnaireStats = {
    total: rows.length,
    workshopsRequested: 0,
    keynotes: 0,
    active: 0,
    pending: 0,
  };

  for (const r of rows) {
    if (r.status === "active") stats.active++;
    else if (r.status === "pending") stats.pending++;

    if (r.conduct_workshop) stats.workshopsRequested++;
    if (r.is_keynote_speaker) stats.keynotes++;
  }

  return stats;
}

export async function createSpeakerQuestionnaire(
  context: EventMemberContext,
  input: EventSpeakerQuestionnaireInput
) {
  const preferredDateObj = input.preferred_date ? new Date(input.preferred_date) : new Date();

  return prisma.find_speakers_questions.create({
    data: {
      event_id: context.eventId,
      user_id: Number(context.userId) || null,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      name: input.name || `${input.first_name || ""} ${input.last_name || ""}`.trim() || "Speaker",
      email: input.email || context.userEmail || null,
      phone: input.phone || null,
      work_phone: input.work_phone || null,
      title: input.title || null,
      description: input.description || null,
      topic_description: input.topic_description || null,
      talk_duration: input.talk_duration || null,
      date: preferredDateObj,
      preferred_date: preferredDateObj,
      conduct_workshop: input.conduct_workshop,
      workshop_topic: input.workshop_topic || null,
      workshop_duration: input.workshop_duration || null,
      workshop_preferred_date: input.workshop_preferred_date || null,
      workshop_preferred_time: input.workshop_preferred_time || null,
      workshop_description: input.workshop_description || null,
      is_business_speaker: input.is_business_speaker,
      is_keynote_speaker: input.is_keynote_speaker,
      is_webinar_speaker: input.is_webinar_speaker,
      is_seminar_speaker: input.is_seminar_speaker,
      is_live_worksop_speaker: input.is_live_worksop_speaker,
      is_vip_session_speaker: input.is_vip_session_speaker,
      speaker_group: input.speaker_group || null,
      speaker_keyword: input.speaker_keyword || null,
      status: input.status as any,
      profile_pic: "",
    },
  });
}

export async function updateSpeakerQuestionnaire(
  context: EventMemberContext,
  id: number,
  input: EventSpeakerQuestionnaireInput
) {
  const whereClause: any = { id, event_id: context.eventId };
  if (context.role !== "organiser") {
    whereClause.OR = [
      { user_id: Number(context.userId) || -1 },
      { email: context.userEmail || "" },
    ];
  }

  const preferredDateObj = input.preferred_date ? new Date(input.preferred_date) : undefined;

  return prisma.find_speakers_questions.updateMany({
    where: whereClause,
    data: {
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      work_phone: input.work_phone || null,
      title: input.title || null,
      description: input.description || null,
      topic_description: input.topic_description || null,
      talk_duration: input.talk_duration || null,
      preferred_date: preferredDateObj,
      conduct_workshop: input.conduct_workshop,
      workshop_topic: input.workshop_topic || null,
      workshop_duration: input.workshop_duration || null,
      workshop_preferred_date: input.workshop_preferred_date || null,
      workshop_preferred_time: input.workshop_preferred_time || null,
      workshop_description: input.workshop_description || null,
      is_business_speaker: input.is_business_speaker,
      is_keynote_speaker: input.is_keynote_speaker,
      is_webinar_speaker: input.is_webinar_speaker,
      is_seminar_speaker: input.is_seminar_speaker,
      is_live_worksop_speaker: input.is_live_worksop_speaker,
      is_vip_session_speaker: input.is_vip_session_speaker,
      speaker_group: input.speaker_group || null,
      speaker_keyword: input.speaker_keyword || null,
      status: input.status as any,
    },
  });
}

export async function deleteSpeakerQuestionnaire(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_speakers_questions.deleteMany({
    where: { id, event_id: context.eventId },
  });
}

export async function bulkDeleteSpeakerQuestionnaires(context: EventMemberContext, ids: number[]) {
  if (context.role !== "organiser" || ids.length === 0) return { count: 0 };
  return prisma.find_speakers_questions.deleteMany({
    where: { id: { in: ids }, event_id: context.eventId },
  });
}

export async function bulkUpdateSpeakerQuestionnaireStatus(
  context: EventMemberContext,
  ids: number[],
  status: "active" | "pending" | "reject"
) {
  if (context.role !== "organiser" || ids.length === 0) return { count: 0 };
  return prisma.find_speakers_questions.updateMany({
    where: { id: { in: ids }, event_id: context.eventId },
    data: { status: status as any },
  });
}
