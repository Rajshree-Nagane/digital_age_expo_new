import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventSponsorAdminInput } from "@/lib/validations/eventSponsorAdmin";

export interface SponsorAdminRow {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  business: string | null;
  position: string | null;
  website: string | null;
  linkedinUserProfile: string | null;
  sponsorType: string | null;
  status: string | null;
  joiningStatus: string | null;
  isApproved: boolean;
  enableHomePage: boolean;
  featured: boolean;
}

const SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  business: true,
  position: true,
  website: true,
  linkedin_user_profile: true,
  sponsor_type: true,
  status: true,
  joining_status: true,
  is_approved: true,
  enable_home_page: true,
  featured: true,
} as const;

function toRow(s: any): SponsorAdminRow {
  return {
    id: s.id,
    name: s.name ?? "",
    email: s.email,
    phone: s.phone,
    business: s.business,
    position: s.position,
    website: s.website,
    linkedinUserProfile: s.linkedin_user_profile,
    sponsorType: s.sponsor_type,
    status: s.status,
    joiningStatus: s.joining_status,
    isApproved: s.is_approved === 1,
    enableHomePage: s.enable_home_page === 1,
    featured: s.featured === 1,
  };
}

/** Mirrors members/view_sponsor.php's list — organiser's admin view of every sponsor for this event. */
export async function getSponsorsAdmin(context: EventMemberContext): Promise<SponsorAdminRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_event_sponsorer.findMany({
    where: { event_id: context.eventId },
    orderBy: { id: "desc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function createSponsorAdmin(context: EventMemberContext, input: EventSponsorAdminInput) {
  if (context.role !== "organiser") return null;
  return prisma.find_event_sponsorer.create({
    data: {
      event_id: context.eventId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      business: input.business || null,
      position: input.position || null,
      website: input.website || null,
      linkedin_user_profile: input.linkedin_user_profile || null,
      sponsor_type: input.sponsor_type || null,
      status: input.status,
      is_approved: input.is_approved ? 1 : 0,
      enable_home_page: input.enable_home_page ? 1 : 0,
      featured: input.featured ? 1 : 0,
    },
    select: { id: true },
  });
}

export async function updateSponsorAdmin(context: EventMemberContext, id: number, input: EventSponsorAdminInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_sponsorer.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      business: input.business || null,
      position: input.position || null,
      website: input.website || null,
      linkedin_user_profile: input.linkedin_user_profile || null,
      sponsor_type: input.sponsor_type || null,
      status: input.status,
      is_approved: input.is_approved ? 1 : 0,
      enable_home_page: input.enable_home_page ? 1 : 0,
      featured: input.featured ? 1 : 0,
    },
  });
}

export async function deleteSponsorAdmin(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_sponsorer.deleteMany({ where: { id, event_id: context.eventId } });
}
