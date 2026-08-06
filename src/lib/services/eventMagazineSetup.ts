import { prisma } from "@/lib/prisma";

export interface MagazineSetupRow {
  id: number;
  eventId: number;
  magazineId: number; // ID in find_magzine_advert_rate_card
  eventCategoryId: number;
  available: number;
  used: number;
  system: number;
  createdOn: string;
  updatedOn: string;
  // Resolved fields from joins
  sectionName?: string;
  advertSize?: string;
  categoryTitle?: string;
  rateCardTitle?: string;
}

export interface MagazineSetupStats {
  totalAvailable: number;
  totalUsed: number;
  totalCount: number;
}

export interface MagazineOptions {
  rateCards: { id: number; advertSize: string | null; title: string; rate: number }[];
  categories: { id: number; title: string }[];
  sections: { id: number; name: string | null; code: string | null }[];
}

export async function getMagazineSetupRows(eventId: number, keyword?: string): Promise<MagazineSetupRow[]> {
  const rows = await prisma.find_event_magazine_setup.findMany({
    where: { event_id: eventId },
    orderBy: { id: "asc" },
  });

  if (rows.length === 0) {
    return [];
  }

  const rateCardIds = Array.from(new Set(rows.map((r) => r.magazine_id).filter(Boolean)));
  const categoryIds = Array.from(new Set(rows.map((r) => r.event_category_id).filter(Boolean)));

  const [rateCards, categories, sections] = await Promise.all([
    rateCardIds.length > 0
      ? prisma.find_magzine_advert_rate_card.findMany({
          where: { id: { in: rateCardIds } },
          select: { id: true, advert_size: true, advert_rate_card_title: true },
        })
      : [],
    categoryIds.length > 0
      ? prisma.find_events_categories.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, title: true },
        })
      : [],
    prisma.find_book_section_setting.findMany({
      select: { section_name: true, section_code: true },
    }),
  ]);

  const rateCardMap = new Map<number, { advertSize: string | null; title: string }>();
  rateCards.forEach((rc) => {
    rateCardMap.set(rc.id, { advertSize: rc.advert_size, title: rc.advert_rate_card_title });
  });

  const categoryMap = new Map<number, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.title));

  const sectionMap = new Map<string, string>();
  sections.forEach((s) => {
    if (s.section_code && s.section_name) {
      sectionMap.set(s.section_code.toLowerCase(), s.section_name);
    }
  });

  let result: MagazineSetupRow[] = rows.map((r) => {
    const rc = rateCardMap.get(r.magazine_id);
    const advertSize = rc?.advertSize || `Size #${r.magazine_id}`;
    const sectionName = sectionMap.get(advertSize.toLowerCase()) || advertSize;
    const categoryTitle = categoryMap.get(r.event_category_id) || `Category #${r.event_category_id}`;

    return {
      id: r.id,
      eventId: r.event_id,
      magazineId: r.magazine_id,
      eventCategoryId: r.event_category_id,
      available: r.available ?? 1,
      used: r.used ?? 0,
      system: r.system ?? 0,
      createdOn: r.created_on ? r.created_on.toISOString() : new Date().toISOString(),
      updatedOn: r.updated_on ? r.updated_on.toISOString() : new Date().toISOString(),
      sectionName,
      advertSize,
      categoryTitle,
      rateCardTitle: rc?.title || advertSize,
    };
  });

  if (keyword && keyword.trim() !== "") {
    const q = keyword.toLowerCase().trim();
    result = result.filter(
      (item) =>
        item.sectionName?.toLowerCase().includes(q) ||
        item.advertSize?.toLowerCase().includes(q) ||
        item.categoryTitle?.toLowerCase().includes(q) ||
        item.rateCardTitle?.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function getMagazineSetupStats(eventId: number): Promise<MagazineSetupStats> {
  const aggregate = await prisma.find_event_magazine_setup.aggregate({
    where: { event_id: eventId },
    _sum: {
      available: true,
      used: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    totalAvailable: aggregate._sum.available || 0,
    totalUsed: aggregate._sum.used || 0,
    totalCount: aggregate._count.id || 0,
  };
}

export async function getMagazineOptions(): Promise<MagazineOptions> {
  const [rateCards, categories, sections] = await Promise.all([
    prisma.find_magzine_advert_rate_card.findMany({
      take: 50,
      select: {
        id: true,
        advert_size: true,
        advert_rate_card_title: true,
        advert_rate: true,
      },
    }),
    prisma.find_events_categories.findMany({
      take: 50,
      select: {
        id: true,
        title: true,
      },
    }),
    prisma.find_book_section_setting.findMany({
      take: 50,
      select: {
        id: true,
        section_name: true,
        section_code: true,
      },
    }),
  ]);

  return {
    rateCards: rateCards.map((rc) => ({
      id: rc.id,
      advertSize: rc.advert_size,
      title: rc.advert_rate_card_title || rc.advert_size || `Rate Card #${rc.id}`,
      rate: rc.advert_rate || 0,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      title: c.title,
    })),
    sections: sections.map((s) => ({
      id: s.id,
      name: s.section_name,
      code: s.section_code,
    })),
  };
}

export async function autoSetupMagazine(eventId: number): Promise<{ insertedCount: number }> {
  // Find event categories and rate cards
  const [categories, rateCards] = await Promise.all([
    prisma.find_events_categories.findMany({ take: 10 }),
    prisma.find_magzine_advert_rate_card.findMany({ take: 10 }),
  ]);

  if (categories.length === 0 || rateCards.length === 0) {
    // Insert default rate cards / categories if empty
    const defaultCat = categories[0]?.id || 1;
    const defaultRate = rateCards[0]?.id || 1;

    const defaultItems = [
      { magazine_id: defaultRate, event_category_id: defaultCat, available: 10, used: 0 },
      { magazine_id: defaultRate + 1, event_category_id: defaultCat, available: 5, used: 0 },
    ];

    let created = 0;
    for (const item of defaultItems) {
      await prisma.find_event_magazine_setup.create({
        data: {
          event_id: eventId,
          magazine_id: item.magazine_id,
          event_category_id: item.event_category_id,
          available: item.available,
          used: item.used,
          system: 1,
        },
      });
      created++;
    }
    return { insertedCount: created };
  }

  let createdCount = 0;
  for (const cat of categories) {
    for (const rc of rateCards.slice(0, 3)) {
      const exists = await prisma.find_event_magazine_setup.findFirst({
        where: {
          event_id: eventId,
          magazine_id: rc.id,
          event_category_id: cat.id,
        },
      });

      if (!exists) {
        await prisma.find_event_magazine_setup.create({
          data: {
            event_id: eventId,
            magazine_id: rc.id,
            event_category_id: cat.id,
            available: 10,
            used: 0,
            system: 0,
          },
        });
        createdCount++;
      }
    }
  }

  return { insertedCount: createdCount };
}

export async function createMagazineSetupItem(eventId: number, data: {
  magazineId: number;
  eventCategoryId: number;
  available?: number;
  used?: number;
  system?: number;
}) {
  return prisma.find_event_magazine_setup.create({
    data: {
      event_id: eventId,
      magazine_id: Number(data.magazineId),
      event_category_id: Number(data.eventCategoryId),
      available: Number(data.available ?? 1),
      used: Number(data.used ?? 0),
      system: data.system ?? 0,
    },
  });
}

export async function updateMagazineSetupItem(id: number, eventId: number, data: {
  magazineId?: number;
  eventCategoryId?: number;
  available?: number;
  used?: number;
  system?: number;
}) {
  const updateData: any = { updated_on: new Date() };
  if (data.magazineId !== undefined) updateData.magazine_id = Number(data.magazineId);
  if (data.eventCategoryId !== undefined) updateData.event_category_id = Number(data.eventCategoryId);
  if (data.available !== undefined) updateData.available = Number(data.available);
  if (data.used !== undefined) updateData.used = Number(data.used);
  if (data.system !== undefined) updateData.system = Number(data.system);

  return prisma.find_event_magazine_setup.updateMany({
    where: { id, event_id: eventId },
    data: updateData,
  });
}

export async function deleteMagazineSetupItem(id: number, eventId: number) {
  return prisma.find_event_magazine_setup.deleteMany({
    where: { id, event_id: eventId },
  });
}

export async function bulkUpdateMagazineSetup(
  eventId: number,
  updates: Record<number, { available?: number; used?: number }>
) {
  let updatedCount = 0;
  for (const [idStr, fields] of Object.entries(updates)) {
    const id = Number(idStr);
    const data: any = { updated_on: new Date() };
    if (fields.available !== undefined) data.available = Number(fields.available);
    if (fields.used !== undefined) data.used = Number(fields.used);

    const res = await prisma.find_event_magazine_setup.updateMany({
      where: { id, event_id: eventId },
      data,
    });
    updatedCount += res.count;
  }

  return { updatedCount };
}

export async function autoCalculateMagazineStats(eventId: number) {
  const rows = await prisma.find_event_magazine_setup.findMany({
    where: { event_id: eventId },
  });

  let updatedCount = 0;
  for (const r of rows) {
    // Count sponsorers matching magazine_id
    const usedCount = await prisma.find_event_sponsorer.count({
      where: {
        event_id: eventId,
        sponsorship_type: String(r.magazine_id),
      },
    });

    await prisma.find_event_magazine_setup.update({
      where: { id: r.id },
      data: {
        used: usedCount,
        updated_on: new Date(),
      },
    });
    updatedCount++;
  }

  return { updatedCount };
}
