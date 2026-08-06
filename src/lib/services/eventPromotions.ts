import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventPromotionInput } from "@/lib/validations/eventPromotion";

export interface PromotionRow {
  id: number;
  title: string | null;
  description: string | null;
  firstName: string | null;
  lastName: string | null;
  business: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  advertSize: string | null;
  publicationCategory: string | null;
  image: string | null;
  status: string | null;
}

const SELECT_FIELDS = {
  id: true,
  title: true,
  description: true,
  first_name: true,
  last_name: true,
  business: true,
  email: true,
  phone: true,
  position: true,
  advert_size: true,
  publication_category: true,
  image: true,
  status: true,
} as const;

function toRow(p: any): PromotionRow {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    firstName: p.first_name,
    lastName: p.last_name,
    business: p.business,
    email: p.email,
    phone: p.phone,
    position: p.position,
    advertSize: p.advert_size,
    publicationCategory: p.publication_category,
    image: p.image,
    status: p.status,
  };
}

/** Mirrors members/manage_event_promotions.php's organiser-facing table of `find_event_promotions`
 *  ("Content Requests" / promotional offers for the event). Simplified: legacy franchise/order/
 *  magazine-book plumbing (advert price cards, PO generation, exchange services) is dropped in
 *  favour of a plain CRUD list of promotion records. */
export async function getPromotions(context: EventMemberContext): Promise<PromotionRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_event_promotions.findMany({
    where: { event_id: context.eventId },
    orderBy: { id: "desc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function createPromotion(context: EventMemberContext, input: EventPromotionInput) {
  if (context.role !== "organiser") return null;
  return prisma.find_event_promotions.create({
    data: {
      event_id: context.eventId,
      user_id: context.userId,
      title: input.title,
      description: input.description || null,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      name: [input.first_name, input.last_name].filter(Boolean).join(" ") || null,
      business: input.business || null,
      email: input.email || null,
      phone: input.phone || null,
      position: input.position || null,
      advert_size: input.advert_size || null,
      publication_category: input.publication_category || null,
      image: input.image || null,
      status: input.status,
      display_order: 0,
    },
    select: { id: true },
  });
}

export async function updatePromotion(context: EventMemberContext, id: number, input: EventPromotionInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_promotions.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      title: input.title,
      description: input.description || null,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      name: [input.first_name, input.last_name].filter(Boolean).join(" ") || null,
      business: input.business || null,
      email: input.email || null,
      phone: input.phone || null,
      position: input.position || null,
      advert_size: input.advert_size || null,
      publication_category: input.publication_category || null,
      image: input.image || null,
      status: input.status,
    },
  });
}

/** Mirrors the legacy hard delete on `find_event_promotions`. */
export async function deletePromotion(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_promotions.deleteMany({ where: { id, event_id: context.eventId } });
}
