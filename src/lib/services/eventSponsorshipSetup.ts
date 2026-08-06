import { prisma } from "@/lib/prisma";

export interface SponsorshipSetupRow {
  id: number;
  eventId: number;
  userId: number | null;
  listingId: number | null;
  sponsorshipId: number;
  eventCategoryId: number;
  categoryTitle?: string;
  sponsorType: string | null;
  title: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  applyEarlyBird: boolean;
  earlyBirdDiscount: number | null;
  earlyBirdExpiry: string | null;
  registeredMemberDiscount: boolean;
  displayOrder: number;
  available: number;
  used: number;
  soldOut: boolean;
  beforeEventBenefits: string | null;
  duringEventBenefits: string | null;
  afterEventBenefits: string | null;
  active: boolean;
  showBenefits: number | null;
  createdOn: string;
  updatedOn: string;
  banner1: string | null;
  banner2: string | null;
  banner1SpotId: string | null;
  banner2SpotId: string | null;
  image: string | null;
}

export interface SponsorshipSetupStats {
  totalAvailable: number;
  totalUsed: number;
  totalCount: number;
  activeCount: number;
}

export async function getSponsorshipSetupRows(eventId: number): Promise<SponsorshipSetupRow[]> {
  const rows = await prisma.find_event_sponsorship_setup.findMany({
    where: { event_id: eventId },
    orderBy: [
      { display_order: "asc" },
      { id: "asc" },
    ],
  });

  // Fetch category titles if available
  const categoryIds = Array.from(new Set(rows.map((r) => r.event_category_id).filter((id): id is number => !!id)));
  const categories = categoryIds.length > 0
    ? await prisma.find_events_categories.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, title: true },
      })
    : [];

  const categoryMap = new Map<number, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.title));

  return rows.map((r) => ({
    id: r.id,
    eventId: r.event_id,
    userId: r.user_id,
    listingId: r.listing_id,
    sponsorshipId: r.sponsorship_id,
    eventCategoryId: r.event_category_id,
    categoryTitle: categoryMap.get(r.event_category_id) || `Category #${r.event_category_id}`,
    sponsorType: r.sponsor_type,
    title: r.title || "",
    description: r.description,
    shortDescription: r.short_description,
    price: r.price ?? 0,
    applyEarlyBird: !!r.apply_early_bird,
    earlyBirdDiscount: r.early_bird_discount,
    earlyBirdExpiry: r.early_bird_expiry ? r.early_bird_expiry.toISOString().split("T")[0] : null,
    registeredMemberDiscount: !!r.registered_member_discount,
    displayOrder: r.display_order ?? 0,
    available: r.available ?? 0,
    used: r.used ?? 0,
    soldOut: r.sold_out === 1,
    beforeEventBenefits: r.before_event_benefits,
    duringEventBenefits: r.during_event_benefits,
    afterEventBenefits: r.after_event_benefits,
    active: !!r.active,
    showBenefits: r.show_benefits,
    createdOn: r.created_on ? r.created_on.toISOString() : new Date().toISOString(),
    updatedOn: r.updated_on ? r.updated_on.toISOString() : new Date().toISOString(),
    banner1: r.banner1,
    banner2: r.banner2,
    banner1SpotId: r.banner1_spot_id,
    banner2SpotId: r.banner2_spot_id,
    image: r.image,
  }));
}

export async function getSponsorshipSetupStats(eventId: number): Promise<SponsorshipSetupStats> {
  const rows = await prisma.find_event_sponsorship_setup.findMany({
    where: { event_id: eventId },
    select: {
      available: true,
      used: true,
      active: true,
    },
  });

  let totalAvailable = 0;
  let totalUsed = 0;
  let activeCount = 0;

  for (const r of rows) {
    totalAvailable += r.available ?? 0;
    totalUsed += r.used ?? 0;
    if (r.active) activeCount++;
  }

  return {
    totalAvailable,
    totalUsed,
    totalCount: rows.length,
    activeCount,
  };
}

export async function autoSetupSponsorship(eventId: number) {
  // Fetch master categories from find_sponsorship_categories
  const masterCategories = await prisma.find_sponsorship_categories.findMany({
    where: { active: true },
    orderBy: { display_order: "asc" },
  });

  if (masterCategories.length === 0) {
    // If no active master categories, fetch all master categories
    const allMaster = await prisma.find_sponsorship_categories.findMany({
      orderBy: { display_order: "asc" },
      take: 20,
    });
    masterCategories.push(...allMaster);
  }

  const existing = await prisma.find_event_sponsorship_setup.findMany({
    where: { event_id: eventId },
    select: { sponsorship_id: true, title: true },
  });

  const existingSet = new Set(existing.map((e) => e.sponsorship_id || e.title));

  let insertedCount = 0;
  for (const master of masterCategories) {
    if (!existingSet.has(master.id) && !existingSet.has(master.title)) {
      await prisma.find_event_sponsorship_setup.create({
        data: {
          event_id: eventId,
          sponsorship_id: master.id,
          event_category_id: master.sponsorship_category_id || 1,
          sponsor_type: master.sponsor_type || "STES",
          title: master.title,
          description: master.description || "",
          short_description: master.short_description || "",
          price: master.price || 0,
          apply_early_bird: master.apply_early_bird || false,
          early_bird_discount: master.early_bird_discount || null,
          early_bird_expiry: master.early_bird_expiry || null,
          registered_member_discount: master.registered_member_discount || false,
          display_order: master.display_order || 1,
          available: master.default_availability ? parseInt(master.default_availability, 10) || 5 : 5,
          used: 0,
          sold_out: 0,
          before_event_benefits: master.before_event_benefits || "",
          during_event_benefits: master.during_event_benefits || "",
          after_event_benefits: master.after_event_benefits || "",
          active: true,
          show_benefits: master.show_benefits || 1,
        },
      });
      insertedCount++;
    }
  }

  return { insertedCount };
}

export async function createSponsorshipSetupItem(eventId: number, data: any) {
  return prisma.find_event_sponsorship_setup.create({
    data: {
      event_id: eventId,
      sponsorship_id: data.sponsorshipId || 1,
      event_category_id: data.eventCategoryId ? Number(data.eventCategoryId) : 1,
      sponsor_type: data.sponsorType || "STES",
      title: data.title,
      description: data.description || "",
      short_description: data.shortDescription || "",
      price: data.price ? parseFloat(data.price) : 0,
      apply_early_bird: !!data.applyEarlyBird,
      early_bird_discount: data.earlyBirdDiscount ? parseFloat(data.earlyBirdDiscount) : null,
      early_bird_expiry: data.earlyBirdExpiry ? new Date(data.earlyBirdExpiry) : null,
      registered_member_discount: !!data.registeredMemberDiscount,
      display_order: data.displayOrder ? parseInt(data.displayOrder, 10) : 1,
      available: data.available !== undefined ? parseInt(data.available, 10) : 1,
      used: data.used !== undefined ? parseInt(data.used, 10) : 0,
      sold_out: data.soldOut ? 1 : 0,
      before_event_benefits: data.beforeEventBenefits || "",
      during_event_benefits: data.duringEventBenefits || "",
      after_event_benefits: data.afterEventBenefits || "",
      active: data.active !== undefined ? !!data.active : true,
      show_benefits: data.showBenefits ? 1 : 0,
      banner1: data.banner1 || null,
      banner2: data.banner2 || null,
    },
  });
}

export async function updateSponsorshipSetupItem(eventId: number, id: number, data: any) {
  return prisma.find_event_sponsorship_setup.updateMany({
    where: { id, event_id: eventId },
    data: {
      title: data.title,
      description: data.description,
      short_description: data.shortDescription,
      price: data.price !== undefined ? parseFloat(data.price) : undefined,
      apply_early_bird: data.applyEarlyBird !== undefined ? !!data.applyEarlyBird : undefined,
      early_bird_discount: data.earlyBirdDiscount !== undefined ? (data.earlyBirdDiscount ? parseFloat(data.earlyBirdDiscount) : null) : undefined,
      early_bird_expiry: data.earlyBirdExpiry !== undefined ? (data.earlyBirdExpiry ? new Date(data.earlyBirdExpiry) : null) : undefined,
      registered_member_discount: data.registeredMemberDiscount !== undefined ? !!data.registeredMemberDiscount : undefined,
      display_order: data.displayOrder !== undefined ? parseInt(data.displayOrder, 10) : undefined,
      available: data.available !== undefined ? parseInt(data.available, 10) : undefined,
      used: data.used !== undefined ? parseInt(data.used, 10) : undefined,
      sold_out: data.soldOut !== undefined ? (data.soldOut ? 1 : 0) : undefined,
      before_event_benefits: data.beforeEventBenefits,
      during_event_benefits: data.duringEventBenefits,
      after_event_benefits: data.afterEventBenefits,
      active: data.active !== undefined ? !!data.active : undefined,
      show_benefits: data.showBenefits !== undefined ? (data.showBenefits ? 1 : 0) : undefined,
      banner1: data.banner1 !== undefined ? data.banner1 : undefined,
      banner2: data.banner2 !== undefined ? data.banner2 : undefined,
    },
  });
}

export async function deleteSponsorshipSetupItem(eventId: number, id: number) {
  return prisma.find_event_sponsorship_setup.deleteMany({
    where: { id, event_id: eventId },
  });
}

export async function bulkActionSponsorshipSetup(
  eventId: number,
  action: string,
  ids: number[],
  bulkData?: Record<string, { available?: number; used?: number; displayOrder?: number }>
) {
  if (action === "mark_active") {
    await prisma.find_event_sponsorship_setup.updateMany({
      where: { event_id: eventId, id: { in: ids } },
      data: { active: true },
    });
  } else if (action === "mark_inactive") {
    await prisma.find_event_sponsorship_setup.updateMany({
      where: { event_id: eventId, id: { in: ids } },
      data: { active: false },
    });
  } else if (action === "delete") {
    await prisma.find_event_sponsorship_setup.deleteMany({
      where: { event_id: eventId, id: { in: ids } },
    });
  } else if (action === "update" && bulkData) {
    for (const id of ids) {
      const itemData = bulkData[id];
      if (itemData) {
        await prisma.find_event_sponsorship_setup.updateMany({
          where: { event_id: eventId, id },
          data: {
            available: itemData.available !== undefined ? itemData.available : undefined,
            used: itemData.used !== undefined ? itemData.used : undefined,
            display_order: itemData.displayOrder !== undefined ? itemData.displayOrder : undefined,
          },
        });
      }
    }
  }
}
