import { getIndustries } from "@/lib/services/eventIndustry";
import { IndustryManager } from "@/components/dashboard/IndustryManager";
import { getDomain } from "@/lib/services/domain";
import { getEventById } from "@/lib/services/events";
import Link from "next/link";
import { Building2, ChevronRight, Layers } from "lucide-react";

export const metadata = {
  title: "View Industry List | Event Hub",
  description: "Browse event industries and business categories.",
};

export default async function ViewIndustryListPage() {
  const [domain, industries] = await Promise.all([
    getDomain(),
    getIndustries(),
  ]);
  const event = domain.event_id ? await getEventById(domain.event_id) : null;

  return (
    <main className="min-h-screen bg-zinc-950 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-purple via-purple-900 to-brand-purple-deep text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <nav className="mb-4 flex items-center gap-2 text-xs text-white/70">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-medium">Industry Categories</span>
          </nav>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Building2 className="h-3.5 w-3.5 text-purple-200" />
                Industry Taxonomy
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
                {event ? `${event.title} — Industry Sectors` : "Industry Sectors & Categories"}
              </h1>
              <p className="mt-2 text-sm text-purple-100/90 max-w-2xl">
                Explore the key business sectors, market segments, and participant profiles associated with this event.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-md">
              <Layers className="h-8 w-8 text-purple-200" />
              <div>
                <p className="text-2xl font-black text-white">{industries.length}</p>
                <p className="text-xs text-purple-200">Active Industries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* This card now matches IndustryManager's own dark styling (bg-zinc-900/40, border-white/10,
            text-white/zinc-400) — it used to be a plain white card, which is why this whole
            section was light while the /members/view_industry_list page and the rest of the
            member dashboard are dark; both now share the same component and theme. */}
        <div className="rounded-2xl bg-zinc-900/40 p-6 sm:p-8 shadow-sm border border-white/10">
          <div className="mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Browse Industries</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Filter by keyword or switch between grid card and table layouts</p>
            </div>
          </div>

          <IndustryManager industries={industries} canManage={true} />
        </div>
      </div>
    </main>
  );
}

