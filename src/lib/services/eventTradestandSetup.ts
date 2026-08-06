import { prisma } from "@/lib/prisma";

export interface TradestandSetupRow {
  id: number;
  eventId: number;
  tradestandId: number;
  tradestandName: string;
  eventCategoryId: number;
  categoryTitle: string;
  available: number;
  used: number;
  createdOn: string;
  updatedOn: string;
}

export interface TradestandSetupStats {
  totalAvailable: number;
  totalUsed: number;
  totalCount: number;
}

export interface TradestandOption {
  id: number;
  name: string;
}

export interface CategoryOption {
  id: number;
  title: string;
}

export async function getTradestandOptions(): Promise<{
  stands: TradestandOption[];
  categories: CategoryOption[];
}> {
  // Fetch stand size options from find_fields
  const fields = await prisma.find_fields.findMany({
    take: 100,
    orderBy: { ordering: "asc" },
    select: { id: true, name: true },
  });

  // Fetch event categories from find_events_categories
  const categories = await prisma.find_events_categories.findMany({
    take: 100,
    orderBy: { id: "asc" },
    select: { id: true, title: true },
  });

  return {
    stands: fields.map((f) => ({ id: f.id, name: f.name })),
    categories: categories.map((c) => ({ id: c.id, title: c.title })),
  };
}

export async function getTradestandSetupRows(eventId: number): Promise<TradestandSetupRow[]> {
  const rows = await prisma.find_event_tradestand_setup.findMany({
    where: { event_id: eventId },
    orderBy: { id: "asc" },
  });

  const tradestandIds = Array.from(new Set(rows.map((r) => r.tradestand_id).filter((id): id is number => !!id)));
  const categoryIds = Array.from(new Set(rows.map((r) => r.event_category_id).filter((id): id is number => !!id)));

  const fields = tradestandIds.length > 0
    ? await prisma.find_fields.findMany({
        where: { id: { in: tradestandIds } },
        select: { id: true, name: true },
      })
    : [];

  const categories = categoryIds.length > 0
    ? await prisma.find_events_categories.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, title: true },
      })
    : [];

  const fieldMap = new Map<number, string>();
  fields.forEach((f) => fieldMap.set(f.id, f.name));

  const categoryMap = new Map<number, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.title));

  return rows.map((r) => ({
    id: r.id,
    eventId: r.event_id,
    tradestandId: r.tradestand_id,
    tradestandName: fieldMap.get(r.tradestand_id) || `Tradestand #${r.tradestand_id}`,
    eventCategoryId: r.event_category_id,
    categoryTitle: categoryMap.get(r.event_category_id) || `Category #${r.event_category_id}`,
    available: r.available ?? 1,
    used: r.used ?? 0,
    createdOn: r.created_on ? r.created_on.toISOString() : new Date().toISOString(),
    updatedOn: r.updated_on ? r.updated_on.toISOString() : new Date().toISOString(),
  }));
}

export async function getTradestandSetupStats(eventId: number): Promise<TradestandSetupStats> {
  const aggregate = await prisma.find_event_tradestand_setup.aggregate({
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
    totalAvailable: aggregate._sum.available ?? 0,
    totalUsed: aggregate._sum.used ?? 0,
    totalCount: aggregate._count.id ?? 0,
  };
}

export async function autoSetupTradestand(eventId: number) {
  // Fetch available stand fields and event categories
  const fields = await prisma.find_fields.findMany({
    take: 10,
    orderBy: { ordering: "asc" },
  });

  const categories = await prisma.find_events_categories.findMany({
    take: 5,
    orderBy: { id: "asc" },
  });

  if (fields.length === 0 || categories.length === 0) {
    // If no fields or categories exist, create sample entries for setup
    const defaultField = fields[0] || { id: 1 };
    const defaultCat = categories[0] || { id: 1 };

    const existing = await prisma.find_event_tradestand_setup.findFirst({
      where: { event_id: eventId, tradestand_id: defaultField.id },
    });

    if (!existing) {
      await prisma.find_event_tradestand_setup.create({
        data: {
          event_id: eventId,
          tradestand_id: defaultField.id,
          event_category_id: defaultCat.id,
          available: 10,
          used: 0,
        },
      });
      return { insertedCount: 1 };
    }
    return { insertedCount: 0 };
  }

  const existingRows = await prisma.find_event_tradestand_setup.findMany({
    where: { event_id: eventId },
    select: { tradestand_id: true, event_category_id: true },
  });

  const existingSet = new Set(
    existingRows.map((r) => `${r.tradestand_id}_${r.event_category_id}`)
  );

  let insertedCount = 0;
  for (const field of fields) {
    for (const cat of categories) {
      const key = `${field.id}_${cat.id}`;
      if (!existingSet.has(key)) {
        await prisma.find_event_tradestand_setup.create({
          data: {
            event_id: eventId,
            tradestand_id: field.id,
            event_category_id: cat.id,
            available: 5,
            used: 0,
          },
        });
        insertedCount++;
      }
    }
  }

  return { insertedCount };
}

export async function createTradestandSetupItem(eventId: number, data: any) {
  return prisma.find_event_tradestand_setup.create({
    data: {
      event_id: eventId,
      tradestand_id: Number(data.tradestandId),
      event_category_id: Number(data.eventCategoryId),
      available: data.available !== undefined ? parseInt(data.available, 10) : 1,
      used: data.used !== undefined ? parseInt(data.used, 10) : 0,
    },
  });
}

export async function updateTradestandSetupItem(eventId: number, id: number, data: any) {
  return prisma.find_event_tradestand_setup.updateMany({
    where: { id, event_id: eventId },
    data: {
      tradestand_id: data.tradestandId ? Number(data.tradestandId) : undefined,
      event_category_id: data.eventCategoryId ? Number(data.eventCategoryId) : undefined,
      available: data.available !== undefined ? parseInt(data.available, 10) : undefined,
      used: data.used !== undefined ? parseInt(data.used, 10) : undefined,
      updated_on: new Date(),
    },
  });
}

export async function deleteTradestandSetupItem(eventId: number, id: number) {
  return prisma.find_event_tradestand_setup.deleteMany({
    where: { id, event_id: eventId },
  });
}

export async function bulkActionTradestandSetup(
  eventId: number,
  action: string,
  ids: number[],
  bulkData?: Record<string, { available?: number; used?: number }>
) {
  if (action === "delete") {
    await prisma.find_event_tradestand_setup.deleteMany({
      where: { event_id: eventId, id: { in: ids } },
    });
  } else if (action === "update" && bulkData) {
    for (const id of ids) {
      const itemData = bulkData[id];
      if (itemData) {
        await prisma.find_event_tradestand_setup.updateMany({
          where: { event_id: eventId, id },
          data: {
            available: itemData.available !== undefined ? itemData.available : undefined,
            used: itemData.used !== undefined ? itemData.used : undefined,
            updated_on: new Date(),
          },
        });
      }
    }
  }
}
