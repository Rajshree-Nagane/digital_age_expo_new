import { getDomain } from "@/lib/services/domain";
import { getListingFaqs } from "@/lib/services/faq";
import { FaqAccordionList } from "@/components/faq/FaqAccordionList";
import { staticAssetUrl } from "@/lib/assets";

export const metadata = {
  title: "Frequently Asked Questions | Digital Age Expo",
  description: "Answers to common questions about exhibiting, sponsoring, speaking, and attending Digital Age Expo.",
};

// Legacy frequently-asked-questions.php falls back to this listing id when the domain
// row has no faq_listing_id set.
const FALLBACK_FAQ_LISTING_ID = 866435;

export default async function FrequentlyAskedQuestionsPage() {
  const domain = await getDomain();
  const listingId = domain.faq_listing_id ?? FALLBACK_FAQ_LISTING_ID;
  const faqGroups = await getListingFaqs(listingId);

  return (
    <div className="w-full bg-slate-950 text-white min-h-screen">
      {/* Hero Header Section */}
      <div
        className="relative w-full bg-cover bg-center"
        style={{
          backgroundImage: `url('${staticAssetUrl("https://digitalageexpo.com/files/listing_pages/817601-exibitor.png")}')`,
          height: "30rem",
        }}
      >
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="container mx-auto px-4 h-full relative flex items-center justify-center">
          <div className="w-full max-w-3xl">
            <div style={{ background: "var(--color-scrim)", padding: "2rem" }} className="rounded-2xl shadow-2xl backdrop-blur-sm border border-white/10">
              <h2 className="text-white text-center event_exp_title text-xl sm:text-3xl font-black uppercase tracking-tight">
                DIGITAL AGE EXPO 26TH - 28TH AUGUST 2026 | VIRTUAL EVENT
              </h2>
              <p className="text-center text-sm sm:text-base mt-3" style={{ color: "var(--color-text-soft)", lineHeight: "22px" }}>
                26 to 28 August 2026, Online Virtual Event
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Main Content Section */}
      <div className="container-fluid bg-white py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl shadow-2xl p-6 sm:p-12 relative"
            style={{
              border: "10px solid var(--color-brand-pink)",
              background: "var(--color-warm-bg)",
              marginTop: "-8rem",
            }}
          >
            <div className="text-black font-bold text-3xl">
              <h2 className="text-black font-black" style={{ marginBottom: "0px" }}>
                Frequently Asked Questions
              </h2>
            </div>
            <div className="text-slate-800 font-semibold text-lg mt-1 mb-6">
              {domain.name}
            </div>

            <FaqAccordionList groups={faqGroups} />
          </div>
        </div>
      </div>
    </div>
  );
}
