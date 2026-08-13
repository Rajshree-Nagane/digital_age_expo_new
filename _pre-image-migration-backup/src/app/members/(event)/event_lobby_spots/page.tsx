import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, CircleDot } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getPrimaryLobby } from "@/lib/services/eventLobby";
import { getChildLobbyById } from "@/lib/services/eventLobbyChild";
import { getSpots } from "@/lib/services/eventLobbySpots";
import { LobbySpotsCanvas } from "@/components/dashboard/LobbySpotsCanvas";
import { LobbySubNav } from "@/components/dashboard/LobbySubNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lobby Spots | Event Management" };

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
      <span className="text-brand-pink font-bold">Lobby Spots</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

export default async function EventLobbySpotsPage({
  searchParams,
}: {
  searchParams: Promise<{ child_id?: string; event_id?: string }>;
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
        <h1 className="text-3xl font-black uppercase text-white">Lobby Spots</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Virtual lobby configuration is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  const childId = resolvedParams.child_id ? Number(resolvedParams.child_id) : undefined;
  const lobby = await getPrimaryLobby(context);

  if (!lobby) {
    return (
      <div className="section-transition space-y-6 animate-fade-in">
        <Breadcrumb eventId={eventId} />
        <LobbySubNav eventId={eventId} active="spots" />
        <div className="glass-panel rounded-2xl p-8 text-center border border-white/10 text-zinc-300">
          <p className="mb-4 text-sm font-medium">
            Set up the parent lobby first on the Configure Lobby page, then come back here to place spots for Event #{eventId}.
          </p>
          <Link
            href={`/members/event_lobby_layout_manager?event_id=${eventId}`}
            className="btn-sophisticated inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-all"
          >
            Configure Parent Lobby
          </Link>
        </div>
      </div>
    );
  }

  const child = childId ? await getChildLobbyById(context, childId) : null;
// Use child image if available, otherwise parent image.
// If neither exists, use the default lobby video.
const backgroundImage = child?.image ?? lobby.image ?? null;

const backgroundVideo =
  "https://digitalageexpo.com/files/lobby/event_45.mp4?revision=aa1e7094c326207fe9f239adf18b25c0";  const spots = await getSpots(context, { eventLayoutId: lobby.id, childId: child?.id ?? null });

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />
      <LobbySubNav eventId={eventId} childId={child?.id} active="spots" />

      <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink">
              <CircleDot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Interactive Lobby Spots</h2>
              <p className="text-xs font-medium text-zinc-400">Click and drag or configure interactive hotspots for Event #{eventId}</p>
            </div>
          </div>
        </div>

<LobbySpotsCanvas
  spots={spots}
  backgroundImage={backgroundImage}
  backgroundVideo={backgroundVideo}
  childId={child?.id}
/>      </div>
    </div>
  );
}
