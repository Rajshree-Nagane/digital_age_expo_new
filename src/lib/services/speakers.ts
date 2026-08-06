import { prisma } from "@/lib/prisma";
export type find_speakers_status = "active" | "inactive" | "pending" | "cancelled" | string;

const SELECT_FIELDS = {
  id: true,
  user_id: true,
  name: true,
  position: true,
  business: true,
  title: true,
  description: true,
  description_encrypt: true,
  profile_pic: true,
  facebook_url: true,
  twitter_url: true,
  instagram_url: true,
  youtube_url: true,
  linkedin_user_profile: true,
  calendy_url: true,
  event_id: true,
  event_youtube_url: true,
  past_event_youtube_urls: true,
} as const;

async function withVisitorCounts<T extends { id: number }>(speakers: T[]) {
  if (speakers.length === 0) return speakers as (T & { visitorCount: number })[];
  const counts = await prisma.find_guest_speaker.groupBy({
    by: ["speaker_id"],
    where: { speaker_id: { in: speakers.map((s) => s.id) } },
    _count: { _all: true },
  });
  const countBySpeaker = new Map(counts.map((c: any) => [c.speaker_id, c._count._all]));
  return speakers.map((s) => ({ ...s, visitorCount: countBySpeaker.get(s.id) ?? 0 }));
}

/** Mirrors class_eventspeaker.php::getEventSpeakers() */
export async function getCurrentSpeakers(eventId: number) {
  const speakers = await prisma.find_speakers.findMany({
    where: { event_id: eventId, status: "active", hide_home: { not: 1 }, is_previous_speaker: null },
    orderBy: [{ date: "asc" }, { start_time: "asc" }],
    select: SELECT_FIELDS,
  });
  return withVisitorCounts(speakers);
}

export interface PagedSpeakersResult {
  speakers: Awaited<ReturnType<typeof withVisitorCounts>>;
  total: number;
  page: number;
  pageSize: number;
}

/** Same list as getCurrentSpeakers, paginated for the /view_speaker directory page. */
export async function getCurrentSpeakersPaged(eventId: number, page = 1, pageSize = 20): Promise<PagedSpeakersResult> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const where = { event_id: eventId, status: "active" as const, hide_home: { not: 1 }, is_previous_speaker: null };

  const [total, rows] = await Promise.all([
    prisma.find_speakers.count({ where }),
    prisma.find_speakers.findMany({
      where,
      orderBy: [{ date: "asc" }, { start_time: "asc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      select: SELECT_FIELDS,
    }),
  ]);

  const speakers = await withVisitorCounts(rows);
  return { speakers, total, page: safePage, pageSize };
}

/** Mirrors class_eventspeaker.php::getEventPreviousSpeakers() */
export async function getPreviousSpeakers(previousEventId: number, currentEventId: number) {
  const currentUserIds = await prisma.find_speakers.findMany({
    where: { event_id: currentEventId, is_previous_speaker: null, status: "active", user_id: { not: null } },
    select: { user_id: true },
  });
  const excludedUserIds = currentUserIds.map((s: any) => s.user_id!).filter(Boolean);

  const speakers = await prisma.find_speakers.findMany({
    where: {
      event_id: previousEventId,
      status: "active",
      hide_home: { not: 1 },
      is_previous_speaker: null,
      ...(excludedUserIds.length > 0 ? { user_id: { notIn: excludedUserIds } } : {}),
    },
    orderBy: { first_name: "asc" },
    select: SELECT_FIELDS,
  });
  return withVisitorCounts(speakers);
}

export async function getSpeakerById(id: number) {
  const speaker = await prisma.find_speakers.findUnique({
    where: { id },
    select: {
      ...SELECT_FIELDS,
      first_name: true,
      last_name: true,
      listing_id: true,
      status: true,
      email: true,
      phone: true,
    },
  });
  if (!speaker) return null;

  let description = speaker.description;
  if (speaker.description_encrypt) {
    description = Buffer.from(speaker.description_encrypt, "base64").toString("utf-8");
  }

  let business = speaker.business;
  if (!business && speaker.listing_id) {
    const listing = await prisma.find_listings.findUnique({
      where: { id: speaker.listing_id },
      select: { title: true },
    });
    business = listing?.title ?? null;
  }

  return { ...speaker, description, business };
}

export interface AdminSpeaker {
  id: number;
  name: string;
  business: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  status: find_speakers_status;
  joiningStatus: string | null;
  date: Date;
}

/** Organiser-facing view of every speaker registration for an event, regardless of status. */
export async function getSpeakersForAdmin(eventId: number): Promise<AdminSpeaker[]> {
  const speakers = await prisma.find_speakers.findMany({
    where: { event_id: eventId },
    orderBy: { id: "desc" },
    select: {
      id: true,
      name: true,
      business: true,
      email: true,
      phone: true,
      title: true,
      status: true,
      joining_status: true,
      date: true,
    },
  });

  return speakers.map((speaker: any) => ({
    id: speaker.id,
    name: speaker.name,
    business: speaker.business,
    email: speaker.email,
    phone: speaker.phone,
    title: speaker.title,
    status: speaker.status,
    joiningStatus: speaker.joining_status,
    date: speaker.date,
  }));
}

export async function updateSpeakerStatus(id: number, status: find_speakers_status) {
  return prisma.find_speakers.update({ where: { id }, data: { status }, select: { id: true } });
}

export async function deleteSpeakerRegistration(id: number) {
  return prisma.find_speakers.delete({ where: { id }, select: { id: true } });
}

/** Content sections for the speakers directory & detail pages (find_listing_business_opportunity). */
export async function getSpeakerPageContent(listingId: number) {
  const [whySpeaker, bannerContent] = await Promise.all([
    prisma.find_listing_business_opportunity.findFirst({
      where: { listing_id: listingId, opportunity_intro: "LOSNWHSPK", domain_page_name: "Why Speaker" },
    }),
    prisma.find_listing_business_opportunity.findFirst({
      where: { listing_id: listingId, opportunity_intro: "LOSNSBANN", domain_page_name: "speaker banner" },
    }),
  ]);
  return { whySpeaker, bannerContent };
}