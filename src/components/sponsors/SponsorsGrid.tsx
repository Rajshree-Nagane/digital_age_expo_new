import Link from "next/link";
import { assetUrl } from "@/lib/assets";

interface Sponsor {
  id: number;
  title: string;
  friendlyUrl: string;
  logoExtension: string | null;
  sponsorImage: string | null;
  descriptionShort: string | null;
  sponsorTypeName: string;
}

export function SponsorsGrid({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
          Our Sponsors
        </h2>

        {sponsors.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sponsors.map((sponsor) => {
              const logo = assetUrl(sponsor.sponsorImage) ?? assetUrl(`/files/logo/${sponsor.friendlyUrl}.${sponsor.logoExtension}`);
              return (
                <div
                  key={sponsor.id}
                  className="glass-panel flex flex-col items-center justify-between rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:border-brand-pink/30 hover:-translate-y-1"
                >
                  <div className="flex h-28 w-full items-center justify-center rounded-2xl bg-white/5 p-4 border border-white/10 shadow-inner">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt={sponsor.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-2xl font-black text-white/40 uppercase tracking-tighter">
                        {sponsor.title.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <h5 className="mt-4 text-sm font-black uppercase tracking-tight text-white">{sponsor.title}</h5>
                  <span className="mt-2 inline-block rounded-full bg-brand-pink/10 border border-brand-pink/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-brand-pink">
                    {sponsor.sponsorTypeName}
                  </span>
                  {sponsor.descriptionShort && (
                    <p className="mt-3 text-[11px] text-zinc-500 font-medium line-clamp-2 leading-relaxed">{sponsor.descriptionShort}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-8 text-zinc-500 font-medium italic">Sponsor line-up coming soon.</p>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/view_sponsor"
            className="btn-brand-gradient rounded-full px-8 py-3.5 font-bold text-white shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
          >
            View All Sponsors
          </Link>
          <Link
            href="/why-sponsor"
            className="btn-outline-animated rounded-full bg-slate-900 px-8 py-3.5 font-bold text-white shadow-md transition-all duration-300 hover:bg-slate-800 hover:scale-105 active:scale-95"
          >
            Explore Sponsorship Opportunity
          </Link>
        </div>
      </div>
    </section>
  );
}

