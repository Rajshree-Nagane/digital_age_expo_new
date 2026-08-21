import { numericParam } from "@/lib/searchParams";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, Compass, Sparkles, PlayCircle } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { LobbySubNav } from "@/components/dashboard/LobbySubNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Welcome Tour | Event Management" };

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
      <span className="text-brand-pink font-bold">Welcome Tour</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

export default async function EventLobbyWelcomeTourPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>;
}) {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const resolvedParams = searchParams ? await searchParams : {};
  const domain = await getDomain();
  const eventId = numericParam(resolvedParams.event_id, domain?.event_id ?? 852);

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  if (context.role !== "organiser") {
    return (
      <div className="section-transition space-y-6">
        <Breadcrumb eventId={eventId} />
        <h1 className="text-3xl font-black uppercase text-white">Welcome Tour</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Welcome tour configuration is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />
      <LobbySubNav eventId={eventId} active="tour" />

      <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 text-white space-y-6">
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
            <Compass className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">Virtual Lobby Welcome Tour</h1>
            <p className="text-xs font-medium text-zinc-400">
              Configure guided walkthroughs and introductory video prompts for attendees entering Event #{eventId}.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-brand-pink" />
              <h3 className="text-base font-extrabold uppercase tracking-wide text-white">Tour Step Manager</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Create highlight tour stops pointing to the Auditorium, Exhibition Hall, Networking Lounge, and Help Desk.
            </p>
            <div className="pt-2">
              <button
                type="button"
                className="btn-sophisticated inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white"
              >
                <PlayCircle className="h-4 w-4" /> Add Tour Step
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-base font-extrabold uppercase tracking-wide text-white">Tour Status & Settings</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Automatically trigger tour for first-time visitors or keep available on demand via the lobby top navigation menu.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Tour Enabled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
