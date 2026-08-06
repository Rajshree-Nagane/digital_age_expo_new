import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { StandProfileInput, StandSpotInput } from "@/lib/validations/eventStand";

export interface StandProfile {
  id: number;
  business: string | null;
  website: string | null;
  aboutUs: string | null;
  keynoteSpeechTopic: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  whatsappNo: string | null;
  zoom: string | null;
  calendly: string | null;
  youtube: string | null;
  logo: string | null;
  standNumber: string | null;
  status: string;
}

export interface StandSpot {
  id: number;
  title: string | null;
  helpText: string | null;
  videoUrl: string | null;
  isVideo: boolean;
  chatScript: string | null;
  meetingId: string | null;
  meetingPassword: string | null;
}

export interface StandDetails {
  profile: StandProfile | null;
  spot: StandSpot | null;
}

/**
 * Mirrors event_lobby_layout_manager.php's view_my_booth lookup: `SELECT id, listing_id, user_id
 * FROM find_event_exhibitor WHERE event_id=? AND user_id=?`. Deliberately independent of
 * getEventMemberContext/role — an organiser account can *also* have its own exhibitor row (e.g.
 * the show's own organiser exhibiting at their own event), and getEventMemberContext only
 * populates exhibitorId when the resolved role is "exhibitor".
 */
export async function findExhibitorForUser(eventId: number, userId: number) {
  return prisma.find_event_exhibitor.findFirst({
    where: { event_id: eventId, user_id: userId },
    select: { id: true, listing_id: true, user_id: true, friendly_url: true },
  });
}

/** Looks up one exhibitor row directly by its id — used when an explicit ex_id is passed in. */
export async function findExhibitorById(exhibitorId: number) {
  return prisma.find_event_exhibitor.findUnique({
    where: { id: exhibitorId },
    select: { id: true, listing_id: true, user_id: true, friendly_url: true },
  });
}

/**
 * Fallback lookup by the site's own listing rather than a user_id. Real signed-in accounts
 * always resolve via findExhibitorForUser above; this only exists for the synthetic demo
 * organiser account (id -30, see verifyMemberCredentials), which has no real find_users/
 * find_event_exhibitor row to match on. Without it, "View My Booth" for the demo login has
 * nothing to resolve to and can't demonstrate the real redirect behaviour.
 */
export async function findExhibitorForListing(eventId: number, listingId: number) {
  return prisma.find_event_exhibitor.findFirst({
    where: { event_id: eventId, listing_id: listingId },
    select: { id: true, listing_id: true, user_id: true, friendly_url: true },
  });
}

/** Mirrors members/business_lobby_spots.php — an exhibitor's own stand profile + virtual booth content. */
export async function getMyStand(context: EventMemberContext): Promise<StandDetails> {
  if (context.role !== "exhibitor" || !context.exhibitorId) {
    return { profile: null, spot: null };
  }

  const [exhibitor, spot] = await Promise.all([
    prisma.find_event_exhibitor.findUnique({
      where: { id: context.exhibitorId },
      select: {
        id: true,
        business: true,
        website: true,
        about_us: true,
        keynote_speech_topic: true,
        facebook: true,
        twitter: true,
        instagram: true,
        whatsapp_no: true,
        zoom: true,
        calendly: true,
        youtube: true,
        logo: true,
        stand_number: true,
        status: true,
      },
    }),
    prisma.find_event_lobby_spots.findFirst({
      where: { event_id: context.eventId, user_id: context.userId },
      select: {
        id: true,
        title: true,
        help_text: true,
        video_url: true,
        is_video: true,
        chat_script: true,
        meeting_id: true,
        meeting_password: true,
      },
    }),
  ]);

  return {
    profile: exhibitor
      ? {
          id: exhibitor.id,
          business: exhibitor.business,
          website: exhibitor.website,
          aboutUs: exhibitor.about_us,
          keynoteSpeechTopic: exhibitor.keynote_speech_topic,
          facebook: exhibitor.facebook,
          twitter: exhibitor.twitter,
          instagram: exhibitor.instagram,
          whatsappNo: exhibitor.whatsapp_no,
          zoom: exhibitor.zoom,
          calendly: exhibitor.calendly,
          youtube: exhibitor.youtube,
          logo: exhibitor.logo,
          standNumber: exhibitor.stand_number,
          status: exhibitor.status,
        }
      : null,
    spot: spot
      ? {
          id: spot.id,
          title: spot.title,
          helpText: spot.help_text,
          videoUrl: spot.video_url,
          isVideo: !!spot.is_video,
          chatScript: spot.chat_script,
          meetingId: spot.meeting_id,
          meetingPassword: spot.meeting_password,
        }
      : null,
  };
}

export async function updateStandProfile(context: EventMemberContext, input: StandProfileInput) {
  if (context.role !== "exhibitor" || !context.exhibitorId) return { count: 0 };

  return prisma.find_event_exhibitor.updateMany({
    where: { id: context.exhibitorId, event_id: context.eventId },
    data: {
      business: input.business,
      website: input.website || null,
      about_us: input.about_us || null,
      keynote_speech_topic: input.keynote_speech_topic || null,
      facebook: input.facebook || null,
      twitter: input.twitter || null,
      instagram: input.instagram || null,
      whatsapp_no: input.whatsapp_no || null,
      zoom: input.zoom || null,
      calendly: input.calendly || null,
      youtube: input.youtube || null,
      logo: input.logo || null,
    },
  });
}

export async function updateStandSpot(context: EventMemberContext, input: StandSpotInput) {
  if (context.role !== "exhibitor") return { count: 0 };

  return prisma.find_event_lobby_spots.updateMany({
    where: { event_id: context.eventId, user_id: context.userId },
    data: {
      title: input.title || null,
      help_text: input.help_text || null,
      video_url: input.video_url || null,
      is_video: input.is_video ? 1 : 0,
      chat_script: input.chat_script || null,
      meeting_id: input.meeting_id || null,
      meeting_password: input.meeting_password || null,
      updated_on: new Date(),
    },
  });
}
