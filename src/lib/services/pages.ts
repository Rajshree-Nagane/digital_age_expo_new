import { prisma } from "@/lib/prisma";
import { CACHE_TAGS, cachedRead } from "@/lib/cache";

export interface CMSPage {
  id: number;
  title: string;
  content: string | null;
  friendly_url: string;
  meta_title: string;
  meta_description: string | null;
}

/**
 * The bare lookup, cached across requests.
 *
 * This is one of the hottest reads on the site and the least obvious. It backs the `[...slug]`
 * catch-all, which means EVERY unrecognised URL runs it — and it runs twice per such request, once
 * in `generateMetadata` and again in the page body. Since the catch-all answers arbitrary paths,
 * crawlers can walk an unbounded set of URLs and each one used to cost two database queries.
 *
 * Note this is deliberately the query only, with no try/catch: `getPageByUrl` below keeps the
 * catch. Caching a swallowed failure would store `null` for a page that really exists, and the
 * placeholder would then be served for the whole revalidate window after the database recovered.
 */
const readPageByUrl = cachedRead(
  ["pages", "getPageByUrl"],
  async function readPageByUrl(cleanUrl: string, rawUrl: string) {
    return prisma.find_pages.findFirst({
      where: {
        active: 1,
        OR: [{ friendly_url: cleanUrl }, { friendly_url: rawUrl }, { friendly_url: `/${cleanUrl}` }],
      },
      select: {
        id: true,
        title: true,
        content: true,
        friendly_url: true,
        meta_title: true,
        meta_description: true,
      },
    });
  },
  { tags: [CACHE_TAGS.pages] }
);

export async function getPageByUrl(url: string): Promise<CMSPage | null> {
  try {
    const cleanUrl = url.replace(/^\//, "").replace(/\.php$/, "");
    const page = await readPageByUrl(cleanUrl, url);

    if (!page) return null;

    return {
      id: page.id,
      title: page.title,
      content: page.content,
      friendly_url: page.friendly_url,
      meta_title: page.meta_title,
      meta_description: page.meta_description,
    };
  } catch {
    return null;
  }
}
