import { assetUrl } from "@/lib/assets";

interface Item {
  id: number;
  section_title: string;
  opportunity_images: string;
  additional_info: string;
}

const DEFAULT_ITEMS: Item[] = [
  {
    id: 1,
    section_title: "Lead Sponsor & Tech Partner",
    opportunity_images: "/images/visualytes.png",
    additional_info: "https://www.visualytes.com",
  },
  {
    id: 2,
    section_title: "Powered by",
    opportunity_images: "/images/tillu_white.png",
    additional_info: "https://tillu.co.uk",
  },
  {
    id: 3,
    section_title: "Organised By",
    opportunity_images: "/images/b2bgrowthhub.png",
    additional_info: "https://b2bgrowthhub.com",
  },
];

export function SponsorHostGrid({ items }: { items?: Item[] }) {
  const displayItems = items && items.length > 0 ? items : DEFAULT_ITEMS;

  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-16 text-white border-y border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950" />
      
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-3">
          {displayItems.map((item) => {
            const img = assetUrl(item.opportunity_images);
            return (
              <div
                key={item.id}
                className="group relative flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-500/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-fuchsia-950/50"
              >
                <h3 className="text-lg font-bold tracking-wide text-fuchsia-200">
                  {item.section_title}
                </h3>
                
                <div className="my-6 flex h-28 w-full items-center justify-center">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={item.section_title}
                      className="max-h-24 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>

                {item.additional_info && (
                  <a
                    href={
                      item.additional_info.startsWith("http")
                        ? item.additional_info
                        : `https://${item.additional_info}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-fuchsia-400 underline underline-offset-4 transition hover:text-fuchsia-200"
                  >
                    {item.additional_info.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

