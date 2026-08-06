import { prisma } from "@/lib/prisma";
import { assetUrl } from "@/lib/assets";

export const ARTICLES_PER_PAGE = 6;

export interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  image: string | null;
  tags: string[];
  author: string | null;
  date: Date | null;
}

export interface ArticleDetail extends ArticleSummary {
  description: string | null;
  category: string | null;
}

function toSlug(friendlyUrl: string | null, id: number): string {
  const base = (friendlyUrl || "article").trim();
  return `${base}-${id}`;
}

function toTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function toSummary(a: {
  id: number;
  title: string | null;
  friendly_url: string | null;
  short_description: string | null;
  image: string | null;
  tags: string | null;
  author_full_name: string | null;
  created_on: Date | null;
}): ArticleSummary {
  return {
    id: a.id,
    title: a.title || "Untitled Article",
    slug: toSlug(a.friendly_url, a.id),
    shortDescription: a.short_description,
    image: assetUrl(a.image) ?? null,
    tags: toTags(a.tags),
    author: a.author_full_name,
    date: a.created_on,
  };
}

/** Mirrors articles.php's published/not-deleted article listing (Knowledge Center). */
export async function getArticles(params: { page?: number; keywords?: string } = {}): Promise<{
  articles: ArticleSummary[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const keywords = params.keywords?.trim();

  const where = {
    status: "published",
    is_deleted: false,
    ...(keywords
      ? {
          OR: [
            { title: { contains: keywords } },
            { short_description: { contains: keywords } },
            { tags: { contains: keywords } },
          ],
        }
      : {}),
  };

  const [total, records] = await Promise.all([
    prisma.find_article.count({ where }),
    prisma.find_article.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * ARTICLES_PER_PAGE,
      take: ARTICLES_PER_PAGE,
      select: {
        id: true,
        title: true,
        friendly_url: true,
        short_description: true,
        image: true,
        tags: true,
        author_full_name: true,
        created_on: true,
      },
    }),
  ]);

  return {
    articles: records.map(toSummary),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE)),
  };
}

/** Mirrors article_details.php's single published article lookup by id. */
export async function getArticleById(id: number): Promise<ArticleDetail | null> {
  const a = await prisma.find_article.findFirst({
    where: { id, status: "published", is_deleted: false },
    select: {
      id: true,
      title: true,
      friendly_url: true,
      short_description: true,
      description: true,
      image: true,
      tags: true,
      author_full_name: true,
      created_on: true,
      publication_category: true,
    },
  });

  if (!a) return null;

  return {
    ...toSummary(a),
    description: a.description,
    category: a.publication_category,
  };
}
