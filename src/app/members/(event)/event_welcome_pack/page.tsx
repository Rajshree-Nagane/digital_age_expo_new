import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, PackageCheck, FileText, Download } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";

export const dynamic = "force-dynamic";
export const metadata = { title: "Welcome Pack | Event Management" };

function Breadcrumb({ eventId }: { eventId?: number }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-400">
      <Link href="/" className="flex items-center gap-1 hover:text-brand-pink transition-colors">
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      <ChevronRight className="h-3 w-3 text-zinc-600" />
      <Link href="/members/user_event_summary" className="hover:text-brand-pink transition-colors">
        My Account
      </Link>
      <ChevronRight className="h-3 w-3 text-zinc-600" />
      <span className="text-brand-pink font-bold">Welcome Pack</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

export default async function EventWelcomePackPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>;
}) {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const resolvedParams = searchParams ? await searchParams : {};
  const domain = await getDomain();
  const eventId = resolvedParams.event_id ? Number(resolvedParams.event_id) : (domain?.event_id ?? 852);

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  if (context.role !== "organiser") {
    return (
      <div className="section-transition space-y-6">
        <Breadcrumb eventId={eventId} />
        <h1 className="text-3xl font-black uppercase text-white">Welcome Pack</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Welcome pack configuration is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />

      <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 text-white space-y-6">
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
            <PackageCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">Attendee Welcome Pack</h1>
            <p className="text-xs font-medium text-zinc-400">
              Manage downloadable brochures, sponsor vouchers, and welcome resources for Event #{eventId}.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {["Event Brochure PDF", "Sponsor Discount Vouchers", "Speaker Presentation Notes", "Exhibition Floorplan"].map((packItem, idx) => (
            <div key={idx} className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-fuchsia-300">Resource #{idx + 1}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Included
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white">{packItem}</h4>
                <p className="text-xs text-zinc-400">Available to all verified attendees upon login.</p>
              </div>
              <button
                type="button"
                className="btn-sophisticated w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-extrabold uppercase tracking-wider text-white"
              >
                <Download className="h-3.5 w-3.5" /> Update Resource
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
