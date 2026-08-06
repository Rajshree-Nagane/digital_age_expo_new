import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomain } from "@/lib/services/domain";
import {
  speakerQuestionaireSchema,
  type SpeakerQuestionaireSessionInput,
} from "@/lib/validations/speakerQuestionaire";

/** Legacy TIME columns store a time-of-day with no meaningful date part. */
const EPOCH = "1970-01-01T";

/** Parses a "dd/mm/yyyy" string (as produced by the questionnaire's date picker) into a Date. */
function parseDdMmYyyy(value: string | undefined): Date | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
}

/** Parses a "HH:MM - HH:MM" range (or a single "HH:MM") into start/end Date objects
 * anchored to the epoch, matching the convention used by the speaker registration route. */
function parseTimeRange(value: string | undefined): { start: Date; end: Date } | null {
  if (!value) return null;
  const parts = value.split("-").map((p) => p.trim());
  const toDate = (t: string) => {
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return new Date(`${EPOCH}${m[1].padStart(2, "0")}:${m[2]}:00Z`);
  };
  const start = toDate(parts[0]);
  const end = parts[1] ? toDate(parts[1]) : start;
  if (!start) return null;
  return { start, end: end ?? start };
}

async function findTargetSpeaker(eventId: number, speakerId: unknown, email: string) {
  if (speakerId !== undefined && speakerId !== null && speakerId !== "") {
    const numericId = Number(speakerId);
    if (!Number.isNaN(numericId)) {
      const bySpeakerId = await prisma.find_speakers.findFirst({
        where: { id: numericId, event_id: eventId },
      });
      if (bySpeakerId) return bySpeakerId;
    }
  }
  return prisma.find_speakers.findFirst({
    where: { event_id: eventId, email },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const speakerId = searchParams.get("speaker_id");
  const email = searchParams.get("email");

  const domain = await getDomain();
  if (!domain.event_id) return NextResponse.json([]);

  const where: Record<string, unknown> = { event_id: domain.event_id };
  if (email) where.email = email;
  if (speakerId) {
    const speaker = await prisma.find_speakers.findFirst({
      where: { id: Number(speakerId), event_id: domain.event_id },
      select: { email: true },
    });
    if (speaker?.email) where.email = speaker.email;
  }

  const submissions = await prisma.find_speakers_questions.findMany({
    where,
    orderBy: { created_on: "desc" },
    take: 50,
  });

  return NextResponse.json(submissions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = speakerQuestionaireSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const domain = await getDomain();
  if (!domain.event_id) {
    return NextResponse.json({ error: "No event is configured for this site." }, { status: 400 });
  }

  const eventId = domain.event_id;
  const { speaker_id, first_name, last_name, email, phone, description, sessions } = parsed.data;

  const speaker = await findTargetSpeaker(eventId, speaker_id, email);
  if (!speaker) {
    return NextResponse.json(
      { error: "We couldn't find a speaker registration for this email. Please complete Speaker Registration first." },
      { status: 404 }
    );
  }

  const [firstSession] = sessions;
  const firstDate = parseDdMmYyyy(firstSession.preferred_date);
  const firstTime = parseTimeRange(firstSession.preferred_time);
  const descriptionEncrypt = Buffer.from(description, "utf-8").toString("base64");

  await prisma.find_speakers.update({
    where: { id: speaker.id },
    data: {
      first_name,
      last_name,
      name: `${first_name} ${last_name}`,
      email,
      phone: phone || speaker.phone,
      description,
      description_encrypt: descriptionEncrypt,
      title: firstSession.title,
      topic_description: firstSession.topic_description || null,
      talk_duration: firstSession.talk_duration || null,
      preferred_date: firstSession.preferred_date,
      preferred_time: firstSession.preferred_time,
      speaker_hall: firstSession.room_type || speaker.speaker_hall,
      agenda_id: firstSession.agenda_id ? Number(firstSession.agenda_id) || null : speaker.agenda_id,
      date: firstDate ?? speaker.date,
      start_time: firstTime?.start ?? speaker.start_time,
      end_time: firstTime?.end ?? speaker.end_time,
      is_profile_complete: true,
    },
  });

  const createSessionRow = (session: SpeakerQuestionaireSessionInput) => {
    const sessionDate = parseDdMmYyyy(session.preferred_date);
    const sessionTime = parseTimeRange(session.preferred_time);
    return prisma.find_speakers_questions.create({
      data: {
        event_id: eventId,
        user_id: speaker.user_id,
        listing_id: speaker.listing_id,
        agenda_id: session.agenda_id ? Number(session.agenda_id) || null : null,
        first_name,
        last_name,
        name: `${first_name} ${last_name}`,
        title: session.title,
        description,
        date: sessionDate ?? new Date(),
        start_time: sessionTime?.start ?? null,
        end_time: sessionTime?.end ?? null,
        profile_pic: speaker.profile_pic || "",
        email,
        phone: phone || speaker.phone,
        speaker_group: session.room_type || null,
        talk_duration: session.talk_duration || null,
        preferred_date: sessionDate,
        preferred_time: sessionTime?.start ?? null,
        topic_description: session.topic_description || null,
      },
      select: { id: true },
    });
  };

  const created = await Promise.all(sessions.map(createSessionRow));

  return NextResponse.json({
    success: true,
    id: created[0]?.id,
    speakerId: speaker.id,
    message: "Speaker questionnaire submitted successfully!",
  });
}
