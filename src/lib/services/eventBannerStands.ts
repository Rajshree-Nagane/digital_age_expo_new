import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventBannerStandInput } from "@/lib/validations/eventBannerStand";

export interface BannerStandRow {
  id: number;
  eventId: number;
  userId: number;
  listingId: number | null;
  listingName: string | null;
  exhibitorUserId: string | null;
  orderId: number | null;
  standId: number | null;
  standPrice: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  workPhone: string | null;
  position: string | null;
  speakerHall: string | null;
  title: string | null;
  description: string | null;
  linkedinUserProfile: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  profilePic: string | null;
  status: string;
  amount: number;
  discount: number;
  charitableAmount: number;
  used: boolean;
  invoiceMailSend: boolean;
  exchangeServices: boolean;
  exchangeAmount: number;
}

export interface BannerStandStats {
  total: number;
  active: number;
  pending: number;
  totalPrice: number;
  totalExchange: number;
}

function formatDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  try {
    return new Date(d).toISOString().split("T")[0];
  } catch {
    return null;
  }
}

function toRow(b: any, listingNameMap: Map<number, string>): BannerStandRow {
  const listingName = b.listing_id ? listingNameMap.get(b.listing_id) || null : null;

  return {
    id: b.id,
    eventId: b.event_id,
    userId: b.user_id,
    listingId: b.listing_id,
    listingName: listingName || b.business || null,
    exhibitorUserId: b.exhibitor_user_id,
    orderId: b.order_id,
    standId: b.stand_id,
    standPrice: Number(b.stand_price) || 0,
    name: b.name,
    firstName: b.first_name,
    lastName: b.last_name,
    email: b.email,
    phone: b.phone,
    workPhone: b.work_phone,
    position: b.position,
    speakerHall: b.speaker_hall,
    title: b.title,
    description: b.description,
    linkedinUserProfile: b.linkedin_user_profile,
    date: formatDate(b.date),
    startTime: b.start_time ? String(b.start_time) : null,
    endTime: b.end_time ? String(b.end_time) : null,
    profilePic: b.profile_pic || null,
    status: b.status || "active",
    amount: Number(b.amount) || 0,
    discount: Number(b.discount) || 0,
    charitableAmount: Number(b.charitable_amount) || 0,
    used: Boolean(b.used),
    invoiceMailSend: Boolean(b.invoice_mail_send),
    exchangeServices: Boolean(b.exchange_services),
    exchangeAmount: Number(b.exchange_amount) || 0,
  };
}

export async function getBannerStands(
  context: EventMemberContext,
  statusFilter?: string
): Promise<BannerStandRow[]> {
  const whereClause: any = { event_id: context.eventId };

  if (context.role !== "organiser") {
    whereClause.OR = [
      { user_id: context.userId },
      { exhibitor_user_id: String(context.userId) },
    ];
  }

  if (statusFilter && ["active", "pending", "reject"].includes(statusFilter)) {
    whereClause.status = statusFilter;
  }

  const rows = await prisma.find_banner_stands.findMany({
    where: whereClause,
    orderBy: { id: "desc" },
  });

  const listingIds = Array.from(new Set(rows.map((r: any) => r.listing_id).filter((id: any): id is number => Boolean(id))));
  const listings = listingIds.length > 0
    ? await prisma.find_listings.findMany({
        where: { id: { in: listingIds } },
        select: { id: true, title: true },
      })
    : [];

  const listingMap = new Map<number, string>(listings.map((l: any) => [l.id, l.title]));

  return rows.map((r: any) => toRow(r, listingMap));
}

export async function getBannerStandStats(context: EventMemberContext): Promise<BannerStandStats> {
  const whereClause: any = { event_id: context.eventId };

  if (context.role !== "organiser") {
    whereClause.OR = [
      { user_id: context.userId },
      { exhibitor_user_id: String(context.userId) },
    ];
  }

  const rows = await prisma.find_banner_stands.findMany({
    where: whereClause,
    select: {
      status: true,
      stand_price: true,
      amount: true,
      exchange_services: true,
      exchange_amount: true,
    },
  });

  const stats: BannerStandStats = {
    total: rows.length,
    active: 0,
    pending: 0,
    totalPrice: 0,
    totalExchange: 0,
  };

  for (const r of rows) {
    if (r.status === "active") stats.active++;
    else if (r.status === "pending") stats.pending++;

    stats.totalPrice += Number(r.stand_price || r.amount || 0);
    if (r.exchange_services) {
      stats.totalExchange += Number(r.exchange_amount || 0);
    }
  }

  return stats;
}

export async function createBannerStand(
  context: EventMemberContext,
  input: EventBannerStandInput
) {
  const targetUserId = input.exhibitor_user_id
    ? Number(input.exhibitor_user_id) || context.userId
    : context.userId;

  const dateObj = input.date ? new Date(input.date) : new Date();

  return prisma.find_banner_stands.create({
    data: {
      event_id: context.eventId,
      user_id: targetUserId,
      exhibitor_user_id: input.exhibitor_user_id || String(targetUserId),
      name: input.name,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      email: input.email || null,
      phone: input.phone || null,
      work_phone: input.work_phone || null,
      position: input.position || null,
      title: input.title || null,
      description: input.description || null,
      speaker_hall: input.speaker_hall || null,
      linkedin_user_profile: input.linkedin_user_profile || null,
      date: dateObj,
      listing_id: input.listing_id || null,
      order_id: input.order_id || null,
      stand_id: input.stand_id || null,
      stand_price: input.stand_price || 0,
      amount: input.stand_price || 0,
      discount: input.discount || 0,
      charitable_amount: input.charitable_amount || 0,
      exchange_services: input.exchange_services ? 1 : 0,
      exchange_amount: input.exchange_amount || 0,
      status: input.status as any,
    },
  });
}

export async function updateBannerStand(
  context: EventMemberContext,
  id: number,
  input: EventBannerStandInput
) {
  const whereClause: any = { id, event_id: context.eventId };
  if (context.role !== "organiser") {
    whereClause.OR = [
      { user_id: context.userId },
      { exhibitor_user_id: String(context.userId) },
    ];
  }

  const dateObj = input.date ? new Date(input.date) : undefined;

  return prisma.find_banner_stands.updateMany({
    where: whereClause,
    data: {
      name: input.name,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      email: input.email || null,
      phone: input.phone || null,
      work_phone: input.work_phone || null,
      position: input.position || null,
      title: input.title || null,
      description: input.description || null,
      speaker_hall: input.speaker_hall || null,
      linkedin_user_profile: input.linkedin_user_profile || null,
      date: dateObj,
      exhibitor_user_id: input.exhibitor_user_id || undefined,
      listing_id: input.listing_id || null,
      order_id: input.order_id || null,
      stand_id: input.stand_id || null,
      stand_price: input.stand_price ?? undefined,
      amount: input.stand_price ?? undefined,
      discount: input.discount ?? undefined,
      charitable_amount: input.charitable_amount ?? undefined,
      exchange_services: input.exchange_services ? 1 : 0,
      exchange_amount: input.exchange_amount ?? undefined,
      status: input.status as any,
    },
  });
}

export async function updateBannerStandAmount(
  context: EventMemberContext,
  id: number,
  amounts: {
    standPrice: number;
    discount: number;
    charitableAmount: number;
    exchangeAmount: number;
  }
) {
  if (context.role !== "organiser") return { count: 0 };

  return prisma.find_banner_stands.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      stand_price: amounts.standPrice,
      amount: amounts.standPrice,
      discount: amounts.discount,
      charitable_amount: amounts.charitableAmount,
      exchange_amount: amounts.exchangeAmount,
    },
  });
}

export async function deleteBannerStand(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_banner_stands.deleteMany({
    where: { id, event_id: context.eventId },
  });
}

export async function bulkDeleteBannerStands(context: EventMemberContext, ids: number[]) {
  if (context.role !== "organiser" || ids.length === 0) return { count: 0 };
  return prisma.find_banner_stands.deleteMany({
    where: { id: { in: ids }, event_id: context.eventId },
  });
}

export async function bulkUpdateBannerStandStatus(
  context: EventMemberContext,
  ids: number[],
  status: "active" | "pending" | "reject"
) {
  if (context.role !== "organiser" || ids.length === 0) return { count: 0 };
  return prisma.find_banner_stands.updateMany({
    where: { id: { in: ids }, event_id: context.eventId },
    data: { status: status as any },
  });
}

export async function getExhibitorOptionsForEvent(eventId: number) {
  const exhibitors = await prisma.find_event_exhibitor.findMany({
    where: { event_id: eventId },
    select: {
      user_id: true,
      name: true,
      business: true,
    },
  });

  return exhibitors
    .filter((e: any) => e.user_id != null)
    .map((e: any) => ({
      userId: e.user_id!,
      name: e.name || "Exhibitor",
      business: e.business || "",
    }));
}

export async function getListingOptionsForUser(userId: number) {
  const listings = await prisma.find_listings.findMany({
    where: { user_id: userId, status: "active" },
    select: { id: true, title: true },
  });

  return listings.map((l: any) => ({ id: l.id, title: l.title }));
}
