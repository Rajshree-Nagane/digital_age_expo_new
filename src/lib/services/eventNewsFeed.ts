import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventNewsFeedInput } from "@/lib/validations/eventNewsFeed";

export interface NewsFeedRow {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  image: string | null;
  limit: number;
  active: boolean;
  issueDate: Date | null;
  expiryDate: Date | null;
}

const SELECT_FIELDS = {
  id: true,
  title: true,
  description: true,
  url: true,
  image: true,
  limit: true,
  active: true,
  issue_date: true,
  expiry_date: true,
} as const;

function toRow(f: any): NewsFeedRow {
  return {
    id: f.id,
    title: f.title ?? "",
    description: f.description,
    url: f.url,
    image: f.image,
    limit: f.limit ?? 0,
    active: f.active === 1,
    issueDate: f.issue_date,
    expiryDate: f.expiry_date,
  };
}

function slugify(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "feed";
}

/** Mirrors members/news_feed.php — organiser-only news items for this event
 * (find_feeds_external, type='internal_feed'). */
export async function getNewsFeedItems(context: EventMemberContext): Promise<NewsFeedRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_feeds_external.findMany({
    where: { event_id: context.eventId, type: "internal_feed" },
    orderBy: { id: "desc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function createNewsFeedItem(context: EventMemberContext, input: EventNewsFeedInput) {
  if (context.role !== "organiser") return null;
  return prisma.find_feeds_external.create({
    data: {
      event_id: context.eventId,
      user_id: context.userId,
      type: "internal_feed",
      title: input.title,
      description: input.description,
      url: input.url || null,
      image: input.image || null,
      limit: input.limit,
      active: input.active ? 1 : 0,
      friendly_url: slugify(input.title),
      issue_date: input.issue_date ? new Date(input.issue_date) : null,
      expiry_date: input.expiry_date ? new Date(input.expiry_date) : null,
    },
    select: { id: true },
  });
}

export async function updateNewsFeedItem(context: EventMemberContext, id: number, input: EventNewsFeedInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_feeds_external.updateMany({
    where: { id, event_id: context.eventId, type: "internal_feed" },
    data: {
      title: input.title,
      description: input.description,
      url: input.url || null,
      image: input.image || null,
      limit: input.limit,
      active: input.active ? 1 : 0,
      issue_date: input.issue_date ? new Date(input.issue_date) : null,
      expiry_date: input.expiry_date ? new Date(input.expiry_date) : null,
    },
  });
}

export async function deleteNewsFeedItem(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_feeds_external.deleteMany({ where: { id, event_id: context.eventId, type: "internal_feed" } });
}

export async function setNewsFeedActive(context: EventMemberContext, id: number, active: boolean) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_feeds_external.updateMany({
    where: { id, event_id: context.eventId, type: "internal_feed" },
    data: { active: active ? 1 : 0 },
  });
}
