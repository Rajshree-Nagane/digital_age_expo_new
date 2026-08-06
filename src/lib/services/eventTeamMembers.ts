import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import { roleLabel } from "@/lib/services/eventAccess";
import type { EventTeamMemberInput } from "@/lib/validations/eventTeamMember";

const SELECT_FIELDS = {
  id: true,
  event_id: true,
  member_user_id: true,
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
  work_phone: true,
  listing_id: true,
  position: true,
  member_type: true,
  status: true,
  joining_status: true,
  description: true,
  profile_pic: true,
  is_contact: true,
  enable_chat: true,
  linkedin_user_profile: true,
} as const;

export interface TeamMemberRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  workPhone: string;
  business: string | null;
  position: string;
  memberType: string;
  status: string | null;
  joiningStatus: string | null;
  description: string | null;
  profilePic: string | null;
  isContact: boolean;
  enableChat: boolean;
  linkedinUserProfile: string | null;
  isOwn: boolean;
}

/** Mirrors members/event_member.php's list view — scoped to "own team" for non-organisers. */
export async function getTeamMembers(context: EventMemberContext): Promise<TeamMemberRow[]> {
  const where =
    context.role === "organiser"
      ? { event_id: context.eventId }
      : { event_id: context.eventId, member_user_id: context.userId };

  const members = await prisma.find_event_member.findMany({
    where,
    orderBy: { id: "desc" },
    select: SELECT_FIELDS,
  });
  if (members.length === 0) return [];

  const listingIds = [...new Set(members.map((m: any) => m.listing_id).filter((id: any): id is number => !!id))];
  const listings =
    listingIds.length > 0
      ? await prisma.find_listings.findMany({ where: { id: { in: listingIds } }, select: { id: true, title: true } })
      : [];
  const listingTitleById = new Map<any, any>(listings.map((l: any) => [l.id, l.title]));

  return members.map((m: any) => ({
    id: m.id,
    firstName: m.first_name,
    lastName: m.last_name,
    email: m.email,
    phone: m.phone,
    workPhone: m.work_phone,
    business: m.listing_id ? listingTitleById.get(m.listing_id) ?? null : null,
    position: m.position,
    memberType: m.member_type,
    status: m.status,
    joiningStatus: m.joining_status,
    description: m.description,
    profilePic: m.profile_pic,
    isContact: !!m.is_contact,
    enableChat: !!m.enable_chat,
    linkedinUserProfile: m.linkedin_user_profile,
    isOwn: m.member_user_id === context.userId,
  }));
}

function generateBatchNumber(eventId: number): string {
  return `EM-${eventId}-${Date.now().toString(36).toUpperCase()}`;
}

/** Mirrors event_member.php's action=add branch. */
export async function createTeamMember(context: EventMemberContext, input: EventTeamMemberInput) {
  return prisma.find_event_member.create({
    data: {
      event_id: context.eventId,
      member_user_id: context.userId,
      listing_id: context.listingId ?? null,
      batch_number: generateBatchNumber(context.eventId),
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone || null,
      work_phone: input.work_phone,
      position: input.position,
      member_type: roleLabel(context.role),
      status: input.status,
      description: input.description || null,
      linkedin_user_profile: input.linkedin_user_profile || null,
      is_contact: input.is_contact,
      enable_chat: input.enable_chat ? 1 : 0,
    },
    select: { id: true },
  });
}

/** Mirrors event_member.php's action=edit branch. Non-organisers may only touch their own team. */
export async function updateTeamMember(context: EventMemberContext, id: number, input: EventTeamMemberInput) {
  const where =
    context.role === "organiser"
      ? { id }
      : { id, member_user_id: context.userId };

  return prisma.find_event_member.updateMany({
    where,
    data: {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone || null,
      work_phone: input.work_phone,
      position: input.position,
      status: input.status,
      description: input.description || null,
      linkedin_user_profile: input.linkedin_user_profile || null,
      is_contact: input.is_contact,
      enable_chat: input.enable_chat ? 1 : 0,
    },
  });
}

export async function deleteTeamMember(context: EventMemberContext, id: number) {
  const where =
    context.role === "organiser"
      ? { id }
      : { id, member_user_id: context.userId };

  return prisma.find_event_member.deleteMany({ where });
}
