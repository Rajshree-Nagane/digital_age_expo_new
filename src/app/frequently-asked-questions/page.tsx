import { getDomain } from "@/lib/services/domain";
import { getListingFaqs } from "@/lib/services/faq";
import { FaqPageContent } from "./FaqPageContent";

/**
 * SERVER COMPONENT — do not add "use client" to this file.
 *
 * `metadata`, `getDomain()` and `getListingFaqs()` are all server-only: the
 * first is resolved before the page renders, the other two run Prisma queries
 * that must never reach the browser bundle. All the interactive accordion
 * state lives in ./FaqPageContent.tsx, which is the "use client" half.
 */

export const metadata = {
  title: "Frequently Asked Questions | Digital Age Expo",
  description:
    "Answers to common questions about exhibiting, sponsoring, speaking, and attending Digital Age Expo.",
};

// Legacy frequently-asked-questions.php falls back to this listing id
// when the domain row has no faq_listing_id set.
const FALLBACK_FAQ_LISTING_ID = 866435;

export default async function FrequentlyAskedQuestionsPage() {
  const domain = await getDomain();

  const listingId =
    domain.faq_listing_id ?? FALLBACK_FAQ_LISTING_ID;

  const faqGroups = await getListingFaqs(listingId);

  /*
   * Flatten all FAQ groups into one list.
   *
   * This allows us to show exactly 10 questions initially,
   * regardless of how many questions exist in each group.
   */
  const allQuestions = faqGroups.flatMap((group: any, groupIndex: number) =>
    (group.items || []).map((item: any, itemIndex: number) => ({
      ...item,
      groupTitle:
        group.title ||
        group.name ||
        "Frequently Asked Questions",
      uniqueId:
        item.id ??
        `${groupIndex}-${itemIndex}`,
    }))
  );

  return (
    <FaqPageContent
      domainName={domain.name}
      allQuestions={allQuestions}
    />
  );
}
