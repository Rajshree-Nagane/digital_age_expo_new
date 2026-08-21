import { numericParam } from "@/lib/searchParams";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getPrimaryLobby } from "@/lib/services/eventLobby";
import {
  getAgendaTracks,
  getAgendaItems,
  getAgendaAssignableSpeakers,
} from "@/lib/services/eventLobbyAgendaItems";
import { AgendaItemManager } from "@/components/dashboard/AgendaItemManager";
import { LobbySubNav } from "@/components/dashboard/LobbySubNav";
import { Home, ChevronRight, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Event Agenda | Event Management" };

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
      <span className="text-brand-pink font-bold">Event Agenda</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

export default async function EventLobbyAgendaItemsPage({
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
        <h1 className="text-3xl font-black uppercase text-white">Event Agenda</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            The event schedule is only available to the event organiser.
          </p>
        </div>
      </div>
    );
  }

  const lobby = await getPrimaryLobby(context);

  const [tracks, items, speakers] = lobby
    ? await Promise.all([
        getAgendaTracks(context, lobby.id),
        getAgendaItems(context, lobby.id),
        getAgendaAssignableSpeakers(context),
      ])
    : [[], [], []];

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />
      <LobbySubNav eventId={eventId} active="agenda" />

      <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border border-white/10 text-white">
        <div className="border-b border-white/10 pb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">Event Agenda & Schedule</h1>
            <p className="mt-1 text-xs font-medium text-zinc-400">
              Build the day-by-day schedule for your event: session tracks, timings, speakers and streaming links for Event #{eventId}.
            </p>
          </div>
        </div>

        <div className="mt-6">
          {!lobby ? (
            <div className="glass-panel rounded-2xl p-8 text-center border border-white/10 text-zinc-300">
              <p className="mb-4 text-sm font-medium">
                Set up the parent lobby first on the Configure Lobby page, then come back here to build the schedule.
              </p>
              <Link
                href={`/members/event_lobby_layout_manager?event_id=${eventId}`}
                className="btn-sophisticated inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-all"
              >
                Configure Parent Lobby
              </Link>
            </div>
          ) : (
            <AgendaItemManager tracks={tracks} items={items} speakers={speakers} />
          )}
        </div>
      </div>
    </div>
  );
}
