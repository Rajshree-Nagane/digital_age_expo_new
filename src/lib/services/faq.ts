import { prisma } from "@/lib/prisma";
import { CACHE_TAGS, cachedRead } from "@/lib/cache";

export interface FaqGroup {
  area: string;
  faqs: {
    id: number;
    question: string;
    response: string;
    attachment: string | null;
    videoUrl: string | null;
  }[];
}

/**
 * Mirrors frequently-asked-questions.php, grouped by faq_area.
 *
 * Cached across requests (see src/lib/cache.ts). The grouping happens inside the cached scope on
 * purpose: it means the stored value is the finished shape the page renders, so a cache hit costs
 * no re-grouping work either.
 */
export const getListingFaqs = cachedRead(
  ["faq", "getListingFaqs"],
  async function getListingFaqs(listingId: number): Promise<FaqGroup[]> {
    const faqs = await prisma.find_listing_listing_faq.findMany({
      where: { listing_id: listingId },
      orderBy: { faq_sequence: "asc" },
      select: {
        id: true,
        faq_question: true,
        faq_response: true,
        faq_attachment: true,
        video_url: true,
        faq_area: true,
      },
    });

    const groups = new Map<string, FaqGroup>();
    for (const faq of faqs) {
      const area = faq.faq_area || "General";
      if (!groups.has(area)) groups.set(area, { area, faqs: [] });
      groups.get(area)!.faqs.push({
        id: faq.id,
        question: faq.faq_question,
        response: faq.faq_response,
        attachment: faq.faq_attachment || null,
        videoUrl: faq.video_url || null,
      });
    }
    return [...groups.values()];
  },
  { tags: [CACHE_TAGS.faq] }
);
