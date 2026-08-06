import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomain } from "@/lib/services/domain";
import { speakerRegistrationSchema } from "@/lib/validations/speakerRegistration";

/** Legacy TIME columns store a time-of-day with no meaningful date part.
 * A real slot gets assigned by an admin once the speaker is scheduled. */
const UNSCHEDULED_TIME = new Date("1970-01-01T00:00:00Z");

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = speakerRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const domain = await getDomain();
  if (!domain.event_id) {
    return NextResponse.json({ error: "No event is configured for this site." }, { status: 400 });
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    business,
    position,
    linkedin_user_profile,
  } = parsed.data;

  // Check if speaker with this email already registered for this event
  const existing = await prisma.find_speakers.findFirst({
    where: {
      event_id: domain.event_id,
      email: email,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A speaker application with this email address already exists." },
      { status: 409 }
    );
  }

  const speaker = await prisma.find_speakers.create({
    data: {
      event_id: domain.event_id,
      exhibitor_user_id: "",
      speaker_price: 0,
      profile_pic: "",
      name: `${first_name} ${last_name}`,
      first_name,
      last_name,
      email,
      phone,
      business,
      position: position || null,
      linkedin_user_profile: linkedin_user_profile || null,
      date: new Date(),
      start_time: UNSCHEDULED_TIME,
      end_time: UNSCHEDULED_TIME,
      status: "pending",
    },
    select: { id: true },
  });

  return NextResponse.json({
    success: true,
    id: speaker.id,
    nextUrl: `/speaker-questionaire?speaker_id=${speaker.id}`,
  });
}

