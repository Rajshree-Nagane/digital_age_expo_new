import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { UserBlogInput } from "@/lib/validations/userBlog";

export interface BlogPostRow {
  id: number;
  title: string;
  friendlyUrl: string;
  contentShort: string | null;
  content: string;
  status: string;
  date: Date;
  datePublish: Date | null;
}

const SELECT_FIELDS = {
  id: true,
  title: true,
  friendly_url: true,
  content_short: true,
  content: true,
  status: true,
  date: true,
  date_publish: true,
} as const;

function toRow(b: any): BlogPostRow {
  return {
    id: b.id,
    title: b.title ?? "",
    friendlyUrl: b.friendly_url ?? "",
    contentShort: b.content_short,
    content: b.content ?? "",
    status: b.status ?? "active",
    date: b.date,
    datePublish: b.date_publish,
  };
}

function slugify(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "post";
}

/** Mirrors members/user_blog.php's list (event_id branch) — this event's blog posts.
 * Simplified to organiser-only: the legacy page allows any listing owner to manage their own
 * posts, but this rewrite treats the event blog as organiser-owned content, consistent with the
 * other members pages in this app. */
export async function getBlogPosts(context: EventMemberContext): Promise<BlogPostRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_blog.findMany({
    where: { event_id: context.eventId },
    orderBy: { date: "desc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function createBlogPost(context: EventMemberContext, input: UserBlogInput) {
  if (context.role !== "organiser") return null;
  const now = new Date();
  return prisma.find_blog.create({
    data: {
      event_id: context.eventId,
      user_id: context.userId,
      title: input.title,
      friendly_url: `${slugify(input.title)}-${Date.now()}`,
      content: input.content,
      content_short: input.content_short || null,
      date: now,
      date_updated: now,
      date_publish: input.date_publish ? new Date(input.date_publish) : now,
      status: input.status,
      impressions: 0,
      keywords: input.title,
      meta_title: input.title,
      meta_description: input.content_short || input.title,
      meta_keywords: input.title,
      image_extension: "",
    },
    select: { id: true },
  });
}

export async function updateBlogPost(context: EventMemberContext, id: number, input: UserBlogInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_blog.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      title: input.title,
      content: input.content,
      content_short: input.content_short || null,
      date_updated: new Date(),
      ...(input.date_publish ? { date_publish: new Date(input.date_publish) } : {}),
      status: input.status,
      keywords: input.title,
      meta_title: input.title,
      meta_description: input.content_short || input.title,
      meta_keywords: input.title,
    },
  });
}

export async function deleteBlogPost(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_blog.deleteMany({ where: { id, event_id: context.eventId } });
}
