import { numericParam } from "@/lib/searchParams";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, MessageSquare, Users, Sparkles } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { LobbySubNav } from "@/components/dashboard/LobbySubNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Networking Lounge | Event Management" };

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
      <span className="text-brand-pink font-bold">Networking Lounge</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

export default async function EventNetworkingRoomPage({
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
        <h1 className="text-3xl font-black uppercase text-white">Networking Lounge</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Networking room configuration is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />
      <LobbySubNav eventId={eventId} active="networking" />

      <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 text-white space-y-6">
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">Networking & Roundtable Lounge</h1>
            <p className="text-xs font-medium text-zinc-400">
              Configure breakout tables, speed networking matching, and video chat rooms for Event #{eventId}.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-brand-pink" />
              <h3 className="text-base font-extrabold uppercase tracking-wide text-white">Breakout Tables</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Create virtual roundtables with custom seating capacities, moderated chat, and video conferencing integration.
            </p>
            <div className="pt-2">
              <button
                type="button"
                className="btn-sophisticated inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white"
              >
                Create Roundtable
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-fuchsia-400" />
              <h3 className="text-base font-extrabold uppercase tracking-wide text-white">AI Networking Matchmaking</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Enable smart participant recommendations based on shared industry interests and attendee tags.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Matchmaking Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
