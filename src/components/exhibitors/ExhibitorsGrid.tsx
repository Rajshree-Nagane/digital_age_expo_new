import Link from "next/link";
import { assetUrl } from "@/lib/assets";
import { Pagination } from "@/components/ui/Pagination";

interface Exhibitor {
  id: number;
  business: string;
  website: string | null;
  logo: string | null;
  listingId: number | null;
  logoExtension: string | null;
  standNumber: string | null;
}

export function ExhibitorsGrid({
  exhibitors,
  currentPage = 1,
  totalPages = 1,
  zoneId,
  zoneName,
}: {
  exhibitors: Exhibitor[];
  currentPage?: number;
  totalPages?: number;
  /** Set when arriving via a lobby hotspot's zone dropdown (/exhibitors?zone=<id>) — narrows the
   *  heading + pagination links to that one exhibition zone instead of the full directory. */
  zoneId?: number;
  zoneName?: string | null;
}) {
  return (
    <section className="bg-zinc-950 px-6 py-20 text-white border-t border-white/5">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Event Showcase</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
          {zoneName ? zoneName : "Our Exhibitors"}
        </h1>
        {zoneId && (
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Filtered to this exhibition zone —{" "}
            <Link href="/exhibitors" className="text-brand-pink hover:underline">
              view all exhibitors
            </Link>
          </p>
        )}

        {exhibitors.length > 0 ? (
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {exhibitors.map((exhibitor) => {
              const logo =
                assetUrl(exhibitor.logo ? `/files/exhibitor_profile_images/${exhibitor.logo}` : null) ??
                assetUrl(exhibitor.listingId ? `/files/logo/${exhibitor.listingId}.${exhibitor.logoExtension}` : null);
              const nameNode = (
                <h5 className="font-black uppercase tracking-tight text-white group-hover:text-brand-pink transition-colors">{exhibitor.business}</h5>
              );

              return (
                <div key={exhibitor.id} className="glass-panel group flex flex-col items-center justify-between rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                  <div className="flex h-32 w-full items-center justify-center rounded-2xl bg-white/5 p-4 border border-white/10 shadow-inner mb-6">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt={exhibitor.business} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-2xl font-black text-white/30 uppercase tracking-tighter">
                        {exhibitor.business.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {exhibitor.website ? (
                      <a href={exhibitor.website} target="_blank" rel="noreferrer" className="block">
                        {nameNode}
                      </a>
                    ) : (
                      nameNode
                    )}
                    {exhibitor.standNumber && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Stand: <span className="text-brand-pink">{exhibitor.standNumber}</span></p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {exhibitors.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            buildHref={(p) => {
              const params = new URLSearchParams();
              if (p !== 1) params.set("page", String(p));
              if (zoneId) params.set("zone", String(zoneId));
              const query = params.toString();
              return query ? `/exhibitors?${query}` : "/exhibitors";
            }}
            theme="dark"
          />
        )}

        {exhibitors.length === 0 && (
          <div className="mt-12 space-y-4">
            {zoneId && (
              <p className="text-sm text-zinc-400">No exhibitors are in this zone yet.</p>
            )}
            <Link
              href="/exhibitor-registration"
              className="btn-brand-gradient inline-block rounded-full px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition hover:scale-105"
            >
              Apply for Stand
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
