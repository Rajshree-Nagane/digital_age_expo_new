import Link from "next/link";

interface Tier {
  id: number;
  title: string;
  short_description: string | null;
  price: number;
  sold_out: number | null;
}

export function SponsorshipTiersSection({ tiers }: { tiers: Tier[] }) {
  if (tiers.length === 0) return null;

  return (
    <section className="bg-zinc-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Sponsorship Packages</p>
        <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl tracking-tight uppercase">Sponsorship Options</h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.id} className="glass-panel flex flex-col rounded-3xl p-8 text-left shadow-2xl transition-all hover:scale-[1.02]">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">{tier.title}</h3>
              <p className="mt-2 text-2xl font-black text-brand-pink">£{tier.price.toLocaleString()}</p>
              {tier.short_description && (
                <p className="mt-4 flex-1 text-sm text-zinc-400 font-medium leading-relaxed">{tier.short_description}</p>
              )}
              <Link
                href={`/sponsor/${tier.id}`}
                className="btn-brand-gradient mt-8 inline-block rounded-full px-8 py-3 text-center text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition"
              >
                {tier.sold_out ? "Sold Out" : "View Details"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
