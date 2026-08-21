import { numericParam } from "@/lib/searchParams";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, ExternalLink } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getPrimaryLobby } from "@/lib/services/eventLobby";
import { getChildLobbies } from "@/lib/services/eventLobbyChild";
import { ChildLobbyManager } from "@/components/dashboard/ChildLobbyManager";
import { LobbySubNav } from "@/components/dashboard/LobbySubNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Child Lobby Details | Event Management" };

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
      <span className="text-brand-pink font-bold">Child Lobby Details</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

export default async function EventLobbyLayoutChildPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; event_id?: string; id?: string }>;
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
        <h1 className="text-3xl font-black uppercase text-white">Child Lobby Details</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Virtual lobby configuration is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  const lobby = await getPrimaryLobby(context);
  const childLobbies = lobby ? await getChildLobbies(context, lobby.id) : [];

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />
      <LobbySubNav eventId={eventId} childId={lobby?.id} active="child" />

      {!lobby ? (
        <div className="glass-panel rounded-2xl p-8 text-center border border-white/10 text-zinc-300">
          <p className="mb-4 text-sm font-medium">
            Set up the parent lobby first on the Configure Lobby page, then come back here to add child lobby zones for Event #{eventId}.
          </p>
          <Link
            href={`/members/event_lobby_layout_manager?event_id=${eventId}`}
            className="btn-sophisticated inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-all"
          >
            Configure Parent Lobby
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl">
          <ChildLobbyManager childLobbies={childLobbies} eventId={eventId} parentLobbyId={lobby.id} />
        </div>
      )}
    </div>
  );
}
