import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventAdvertiserInput } from "@/lib/validations/eventAdvertiser";

export interface AdvertiserRow {
  id: number;
  firstName: string | null;
  lastName: string | null;
  business: string | null;
  email: string | null;
  phone: string | null;
  workPhone: string | null;
  position: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  publicationCategory: string | null;
  exchangeServices: boolean;
  exchangeAmount: string | null;
  showAdvertiserOnSpeaker: boolean;
  showAdvertiserOnVisitor: boolean;
  showAdvertiserOnSponsor: boolean;
  showAdvertiserOnUpcomingEvent: boolean;
  status: string | null;
  advertSize: string | null;
  advertSizePrice: number;
  discount: number;
  charitableAmount: number;
  listingId: number | null;
  orderId: number | null;
  flag: boolean;
  fb: string | null;
  twitter: string | null;
  linkedin: string | null;
}

export interface AdvertiserStats {
  activeAdverts: number;
  inactiveAdverts: number;
  totalAdverts: number;
  activeAdvertisers: number;
  inactiveAdvertisers: number;
  totalAdvertisers: number;
  flaggedAdvertisers: number;
}

const SELECT_FIELDS = {
  id: true,
  first_name: true,
  last_name: true,
  business: true,
  email: true,
  phone: true,
  work_phone: true,
  position: true,
  title: true,
  description: true,
  image: true,
  publication_category: true,
  exchange_services: true,
  exchange_amount: true,
  show_advertiser_on_speaker: true,
  show_advertiser_on_visitor: true,
  show_advertiser_on_sponsor: true,
  show_advertiser_on_upcoming_event: true,
  status: true,
  advert_size: true,
  advert_size_price: true,
  discount: true,
  charitable_amount: true,
  listing_id: true,
  order_id: true,
  flag: true,
  fb: true,
  twitter: true,
  linkedin: true,
} as const;

function toRow(a: any): AdvertiserRow {
  return {
    id: a.id,
    firstName: a.first_name,
    lastName: a.last_name,
    business: a.business,
    email: a.email,
    phone: a.phone,
    workPhone: a.work_phone,
    position: a.position,
    title: a.title,
    description: a.description,
    image: a.image,
    publicationCategory: a.publication_category,
    exchangeServices: a.exchange_services === "1" || a.exchange_services === "true" || !!a.exchange_services,
    exchangeAmount: a.exchange_amount,
    showAdvertiserOnSpeaker: !!a.show_advertiser_on_speaker,
    showAdvertiserOnVisitor: !!a.show_advertiser_on_visitor,
    showAdvertiserOnSponsor: !!a.show_advertiser_on_sponsor,
    showAdvertiserOnUpcomingEvent: !!a.show_advertiser_on_upcoming_event,
    status: a.status,
    advertSize: a.advert_size,
    advertSizePrice: a.advert_size_price ?? 0,
    discount: a.discount ?? 0,
    charitableAmount: a.charitable_amount ?? 0,
    listingId: a.listing_id,
    orderId: a.order_id,
    flag: !!a.flag,
    fb: a.fb,
    twitter: a.twitter,
    linkedin: a.linkedin,
  };
}

const REQUIRED_LEGACY_DEFAULTS = {
  short_description: "",
  profile_pic: "",
  display_order: 0,
} as const;

export async function getAdvertisers(context: EventMemberContext): Promise<AdvertiserRow[]> {
  const rows = await prisma.find_event_advertisor.findMany({
    where: { event_id: context.eventId },
    orderBy: { id: "desc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function getAdvertiserStats(context: EventMemberContext): Promise<AdvertiserStats> {
  const allRows = await prisma.find_event_advertisor.findMany({
    where: { event_id: context.eventId },
    select: {
      status: true,
      listing_id: true,
      flag: true,
    },
  });

  const activeAdverts = allRows.filter((r: any) => r.status === "active").length;
  const inactiveAdverts = allRows.filter((r: any) => r.status !== "active").length;
  const totalAdverts = allRows.length;

  const activeAdvertisersSet = new Set(
    allRows.filter((r: any) => r.status === "active" && r.listing_id).map((r: any) => r.listing_id)
  );
  const inactiveAdvertisersSet = new Set(
    allRows.filter((r: any) => r.status !== "active" && r.listing_id).map((r: any) => r.listing_id)
  );
  const totalAdvertisersSet = new Set(
    allRows.filter((r: any) => r.listing_id).map((r: any) => r.listing_id)
  );

  const flaggedAdvertisers = allRows.filter((r: any) => r.flag).length;

  return {
    activeAdverts,
    inactiveAdverts,
    totalAdverts,
    activeAdvertisers: activeAdvertisersSet.size,
    inactiveAdvertisers: inactiveAdvertisersSet.size,
    totalAdvertisers: totalAdvertisersSet.size,
    flaggedAdvertisers,
  };
}

export async function createAdvertiser(context: EventMemberContext, input: EventAdvertiserInput) {
  return prisma.find_event_advertisor.create({
    data: {
      event_id: context.eventId,
      user_id: context.userId,
      added_by_user_id: context.userId,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      business: input.business || null,
      email: input.email || null,
      phone: input.phone || null,
      work_phone: input.work_phone || null,
      position: input.position || null,
      title: input.title || null,
      description: input.description || null,
      image: input.image || null,
      publication_category: input.publication_category || null,
      exchange_services: input.exchange_services ? "1" : null,
      exchange_amount: input.exchange_amount || null,
      show_advertiser_on_speaker: input.show_advertiser_on_speaker ? 1 : 0,
      show_advertiser_on_visitor: input.show_advertiser_on_visitor ? 1 : 0,
      show_advertiser_on_sponsor: input.show_advertiser_on_sponsor ? 1 : 0,
      show_advertiser_on_upcoming_event: input.show_advertiser_on_upcoming_event ? 1 : 0,
      status: input.status,
      advert_size: input.advert_size || null,
      advert_size_price: input.advert_size_price,
      discount: input.discount,
      charitable_amount: input.charitable_amount,
      listing_id: input.listing_id || null,
      order_id: input.order_id || null,
      flag: !!input.flag,
      fb: input.fb || "",
      twitter: input.twitter || "",
      linkedin: input.linkedin || "",
      ...REQUIRED_LEGACY_DEFAULTS,
    },
    select: { id: true },
  });
}

export async function updateAdvertiser(context: EventMemberContext, id: number, input: EventAdvertiserInput) {
  return prisma.find_event_advertisor.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      business: input.business || null,
      email: input.email || null,
      phone: input.phone || null,
      work_phone: input.work_phone || null,
      position: input.position || null,
      title: input.title || null,
      description: input.description || null,
      image: input.image || null,
      publication_category: input.publication_category || null,
      exchange_services: input.exchange_services ? "1" : null,
      exchange_amount: input.exchange_amount || null,
      show_advertiser_on_speaker: input.show_advertiser_on_speaker ? 1 : 0,
      show_advertiser_on_visitor: input.show_advertiser_on_visitor ? 1 : 0,
      show_advertiser_on_sponsor: input.show_advertiser_on_sponsor ? 1 : 0,
      show_advertiser_on_upcoming_event: input.show_advertiser_on_upcoming_event ? 1 : 0,
      status: input.status,
      advert_size: input.advert_size || null,
      advert_size_price: input.advert_size_price,
      discount: input.discount,
      charitable_amount: input.charitable_amount,
      listing_id: input.listing_id || null,
      order_id: input.order_id || null,
      flag: !!input.flag,
      fb: input.fb || "",
      twitter: input.twitter || "",
      linkedin: input.linkedin || "",
    },
  });
}

export async function deleteAdvertiser(context: EventMemberContext, id: number) {
  return prisma.find_event_advertisor.deleteMany({
    where: { id, event_id: context.eventId },
  });
}

export async function bulkUpdateStatus(context: EventMemberContext, ids: number[], status: "active" | "inactive" | "pending") {
  return prisma.find_event_advertisor.updateMany({
    where: {
      id: { in: ids },
      event_id: context.eventId,
    },
    data: { status },
  });
}

export async function bulkDelete(context: EventMemberContext, ids: number[]) {
  return prisma.find_event_advertisor.deleteMany({
    where: {
      id: { in: ids },
      event_id: context.eventId,
    },
  });
}

export async function bulkFlag(context: EventMemberContext, ids: number[], flag: boolean) {
  return prisma.find_event_advertisor.updateMany({
    where: {
      id: { in: ids },
      event_id: context.eventId,
    },
    data: { flag },
  });
}

export async function copyAdvertiser(context: EventMemberContext, id: number) {
  const source = await prisma.find_event_advertisor.findUnique({
    where: { id },
  });
  if (!source || source.event_id !== context.eventId) {
    throw new Error("Advertiser not found");
  }

  const data = { ...source };
  delete (data as any).id;
  delete (data as any).created_on;

  return prisma.find_event_advertisor.create({
    data: {
      ...data,
      title: `${data.title || "Copy"} (Copy)`,
    },
  });
}

export async function importFromPreviousEvent(context: EventMemberContext, previousEventId: number) {
  const currentEventId = context.eventId;

  // Find all advertisers in previous event that don't exist in current event (based on user_id and listing_id)
  const previousAdvertisers = await prisma.find_event_advertisor.findMany({
    where: { event_id: previousEventId },
  });

  const currentAdvertisers = await prisma.find_event_advertisor.findMany({
    where: { event_id: currentEventId },
    select: { user_id: true, listing_id: true },
  });

  const existingKeys = new Set(
    currentAdvertisers.map((a: any) => `${a.user_id}_${a.listing_id}`)
  );

  const importedData = previousAdvertisers
    .filter((a: any) => !existingKeys.has(`${a.user_id}_${a.listing_id}`))
    .map((a: any) => {
      const rest = { ...a };
      delete (rest as any).id;
      delete (rest as any).created_on;
      return {
        ...rest,
        event_id: currentEventId,
        added_by_user_id: context.userId,
      };
    });

  if (importedData.length > 0) {
    await prisma.find_event_advertisor.createMany({
      data: importedData as any,
    });
  }

  return importedData.length;
}

export async function importFromAllEvents(context: EventMemberContext) {
  const currentEventId = context.eventId;

  // Find advertisers from all other events
  const previousAdvertisers = await prisma.find_event_advertisor.findMany({
    where: {
      event_id: { not: currentEventId },
    },
  });

  const currentAdvertisers = await prisma.find_event_advertisor.findMany({
    where: { event_id: currentEventId },
    select: { user_id: true, listing_id: true },
  });

  const existingKeys = new Set(
    currentAdvertisers.map((a: any) => `${a.user_id}_${a.listing_id}`)
  );

  const importedData = previousAdvertisers
    .filter((a: any) => !existingKeys.has(`${a.user_id}_${a.listing_id}`))
    .map((a: any) => {
      const rest = { ...a };
      delete (rest as any).id;
      delete (rest as any).created_on;
      return {
        ...rest,
        event_id: currentEventId,
        added_by_user_id: context.userId,
      };
    });

  // Remove duplicates within importedData itself
  const seenInImport = new Set<string>();
  const uniqueImportedData = [];
  for (const item of importedData) {
    const key = `${item.user_id}_${item.listing_id}`;
    if (!seenInImport.has(key)) {
      seenInImport.add(key);
      uniqueImportedData.push(item);
    }
  }

  if (uniqueImportedData.length > 0) {
    await prisma.find_event_advertisor.createMany({
      data: uniqueImportedData as any,
    });
  }

  return uniqueImportedData.length;
}
