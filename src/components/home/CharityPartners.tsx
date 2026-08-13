import Link from "next/link";
import { assetUrl, staticAssetUrl } from "@/lib/assets";

interface Partner {
  id: number;
  charity_name: string;
  logo: string | null;
}

const DEFAULT_PARTNER: Partner = {
  id: 1,
  charity_name: "Wessex Cancer Trust",
  logo: staticAssetUrl("/images/charity.png"),
};

export function CharityPartners({ partners }: { partners?: Partner[] }) {
  const displayPartners = partners && partners.length > 0 ? partners : [DEFAULT_PARTNER];

  return (
    <section className="relative overflow-hidden bg-zinc-950 px-6 py-20 text-white border-t border-white/5">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
          Our Charity Partners
        </h2>
        
        <div className="mt-12 flex flex-wrap items-center justify-center gap-10">
          {displayPartners.map((partner) => {
            const logo = assetUrl(partner.logo) || DEFAULT_PARTNER.logo;
            return (
              <div
                key={partner.id}
                className="flex h-36 items-center justify-center rounded-2xl bg-white/5 p-6 border border-white/10 shadow-xl transition-transform duration-300 hover:scale-105 backdrop-blur-md"
              >
                {logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={partner.charity_name}
                    className="max-h-28 w-auto object-contain"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <Link
            href="/charity-partnership"
            className="btn-brand-gradient inline-block rounded-full px-8 py-3.5 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Apply for Charity Partnership
          </Link>
        </div>
      </div>
    </section>
  );
}

