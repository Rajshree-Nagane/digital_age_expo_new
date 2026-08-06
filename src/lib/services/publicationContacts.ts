import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { PublicationContactInput } from "@/lib/validations/publicationContact";

export interface PublicationContactRow {
  id: number;
  type: string;
  name: string;
  email: string;
  telephone: string;
  linkedinUserProfile: string | null;
}

const SELECT_FIELDS = {
  id: true,
  type: true,
  name: true,
  email: true,
  telephone: true,
  linkedin_user_profile: true,
} as const;

function toRow(c: any): PublicationContactRow {
  return {
    id: c.id,
    type: c.type ?? "",
    name: c.name ?? "",
    email: c.email ?? "",
    telephone: c.telephone ?? "",
    linkedinUserProfile: c.linkedin_user_profile,
  };
}

/** Mirrors members/publication_contacts.php's list — organiser's admin view of press/media
 * contacts registered for this event's publications. */
export async function getPublicationContacts(context: EventMemberContext): Promise<PublicationContactRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_event_publication_contacts.findMany({
    where: { event_id: context.eventId },
    orderBy: { id: "desc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function createPublicationContact(context: EventMemberContext, input: PublicationContactInput) {
  if (context.role !== "organiser") return null;
  return prisma.find_event_publication_contacts.create({
    data: {
      event_id: context.eventId,
      user_id: context.userId,
      type: input.type,
      name: input.name,
      email: input.email,
      telephone: input.telephone,
      linkedin_user_profile: input.linkedin_user_profile || null,
    },
    select: { id: true },
  });
}

export async function updatePublicationContact(context: EventMemberContext, id: number, input: PublicationContactInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_publication_contacts.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      type: input.type,
      name: input.name,
      email: input.email,
      telephone: input.telephone,
      linkedin_user_profile: input.linkedin_user_profile || null,
    },
  });
}

export async function deletePublicationContact(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_publication_contacts.deleteMany({ where: { id, event_id: context.eventId } });
}
