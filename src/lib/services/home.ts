import { prisma } from "@/lib/prisma";
import { getPhrases } from "@/lib/services/language";
import { getEventById, getEventDateRange } from "@/lib/services/events";
import { getApprovedSponsors } from "@/lib/services/sponsors";
import type { SiteDomain } from "@/lib/services/domain";
import { getEventExhibitors } from "@/lib/services/exhibitors";
import { getEventSchedule } from "@/lib/services/schedule";

const SPEAKER_LIMIT = 8;

async function getSpeakers(eventId: number) {
  const speakers = await prisma.find_speakers.findMany({
    where: {
      event_id: eventId,
      status: "active",
      hide_home: { not: 1 },
      is_previous_speaker: null,
    },
    orderBy: [{ date: "asc" }, { start_time: "asc" }],
    take: SPEAKER_LIMIT,
    select: {
      id: true,
      name: true,
      position: true,
      business: true,
      profile_pic: true,
    },
  });
  return speakers;
}

async function getCharityPartners(listingId: number) {
  return prisma.find_listing_charity_partners.findMany({
    where: { listing_id: listingId, status: "PSA", NOT: { logo: null } },
    select: { id: true, charity_name: true, logo: true },
  });
}

export async function getOpportunityContent(listingId: number) {
  const [aboutEvent, sponsorHostData, exploreEvent, joinFacebook, bookYourStand, topBanner] =
    await Promise.all([
      prisma.find_listing_business_opportunity.findFirst({
        where: { listing_id: listingId, opportunity_intro: "LOSNABTEV", domain_page_name: "About Events" },
        orderBy: { sequence: "asc" },
      }),
      prisma.find_listing_business_opportunity.findMany({
        where: { listing_id: listingId, opportunity_intro: "LOSONI", domain_page_name: "Home" },
        orderBy: { sequence: "asc" },
      }),
      prisma.find_listing_business_opportunity.findFirst({
        where: { listing_id: listingId, domain_page_name: "explore_the_event" },
      }),
      prisma.find_listing_business_opportunity.findFirst({
        where: { listing_id: listingId, opportunity_intro: "LOSNJUOFG", domain_page_name: "Home" },
      }),
      prisma.find_listing_business_opportunity.findFirst({
        where: { listing_id: listingId, opportunity_intro: "LOSNWHEXH", domain_page_name: "book_your_stand" },
        orderBy: { sequence: "asc" },
      }),
      prisma.find_listing_business_opportunity.findFirst({
        where: { listing_id: listingId, domain_page_name: "dae_index_topbanner" },
      }),
    ]);

  return { aboutEvent, sponsorHostData, exploreEvent, joinFacebook, bookYourStand, topBanner };
}

export async function getHomePageData(domain: SiteDomain) {
  const eventId = domain.event_id;
  const listingId = domain.linked_profile_listing_id;

  const [event, eventDates, speakers, sponsors, charityPartners, opportunityContent, phrases, exhibitors, scheduleDays] =
    await Promise.all([
      eventId ? getEventById(eventId) : null,
      eventId ? getEventDateRange(eventId) : null,
      eventId ? getSpeakers(eventId) : [],
      eventId ? getApprovedSponsors(eventId) : [],
      listingId ? getCharityPartners(listingId) : [],
      listingId
        ? getOpportunityContent(listingId)
        : {
            aboutEvent: null,
            sponsorHostData: [],
            exploreEvent: null,
            joinFacebook: null,
            bookYourStand: null,
            topBanner: null,
          },
      getPhrases([
        "counter_visitors",
        "counter_exhibitors",
        "counter_speakers",
        "counter_workshop",
        "buy_tickets_hurry_up",
        "buy_tickets_hurryup_subtext",
        "get_free_ticket_now",
        "get_free_ticket_now_desc",
        "listen_to_the",
        "speakers",
      ]),
      eventId ? getEventExhibitors(eventId) : [],
      eventId ? getEventSchedule(eventId) : [],
    ]);

  return { event, eventDates, speakers, sponsors, charityPartners, opportunityContent, phrases, exhibitors, scheduleDays };
}

export type HomePageData = Awaited<ReturnType<typeof getHomePageData>>;
