// app/members/event_lobby_layout_manager/page.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, ExternalLink } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getEventById } from "@/lib/services/events";
import { findExhibitorForUser, findExhibitorForListing, findExhibitorById } from "@/lib/services/eventStand";
import { getLobbies, getPrimaryLobby, type LobbyRow } from "@/lib/services/eventLobby";
import { getAuditoriumChildLobby } from "@/lib/services/eventLobbyChild";
import { LobbyManager } from "@/components/dashboard/LobbyManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lobby Details | Event Management" };


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
      <span className="text-brand-pink font-bold">Lobby Details</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

function NoticeCard({ title, eventId, children }: { title: string; eventId?: number; children: ReactNode }) {
  return (
    <div className="section-transition space-y-6">
      <Breadcrumb eventId={eventId} />
      <h1 className="text-3xl font-black uppercase tracking-tight text-white">{title}</h1>
      <div className="glass-panel rounded-2xl p-8 border border-white/10 flex items-start gap-4">
        <ExternalLink className="mt-0.5 h-6 w-6 flex-shrink-0 text-brand-pink" />
        <div className="text-zinc-300 leading-relaxed text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export default async function EventLobbyLayoutManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; event_id?: string; id?: string; ex_id?: string; visit_photobooth?: string }>;
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
        <h1 className="text-3xl font-black uppercase text-white">Lobby Details</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Virtual lobby configuration is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  const { action, id: lobbyIdParam, ex_id: exIdParam } = resolvedParams;

  if (action === "change_auditiorium_link") {
    const lobby = await getPrimaryLobby(context);
    const auditorium = lobby ? await getAuditoriumChildLobby(context, lobby.id) : null;
    if (auditorium) {
      redirect(`/members/event_lobby_spots?child_id=${auditorium.id}&event_id=${eventId}`);
    }
    return (
      <NoticeCard title="Change Auditorium Link" eventId={eventId}>
        No auditorium zone has been set up for this event yet. Add one from{" "}
        <Link href={`/members/event_lobby_layout_child?event_id=${eventId}`} className="font-semibold text-brand-pink hover:underline">
          Configure Lobby Child
        </Link>{" "}
        first, then this link will jump straight to its spot editor.
      </NoticeCard>
    );
  }

  if (action === "view_my_booth") {
    const userId = Number(session.user.id);
    // Mirrors the legacy branch: an explicit ex_id wins outright; otherwise resolve the
    // signed-in user's own find_event_exhibitor row for this event.
    let exhibitor = exIdParam ? await findExhibitorById(Number(exIdParam)) : await findExhibitorForUser(eventId, userId);

    // The synthetic demo organiser (-30, see verifyMemberCredentials) has no real find_users row,
    // so it can never match a real find_event_exhibitor.user_id. Fall back to this site's own
    // listing's exhibitor row so the demo login can still demonstrate the real redirect.
    if (!exhibitor && userId < 0 && domain?.linked_profile_listing_id) {
      exhibitor = await findExhibitorForListing(eventId, domain.linked_profile_listing_id);
    }

    // Native booth view (/virtual-directory/[slug]) instead of bouncing out to the legacy
    // lobby.php floor — this only needs the exhibitor's own friendly_url, not the event's.
    if (exhibitor?.friendly_url) {
      redirect(`/virtual-directory/${exhibitor.friendly_url}`);
    }

    return (
      <NoticeCard title="View My Booth" eventId={eventId}>
        {exhibitor
          ? "Your exhibitor booth doesn't have its public link (friendly_url) set up yet. Use Configure Lobby below, or contact support to have your booth's public URL configured."
          : "No exhibitor booth is linked to your account for this event yet. Register as an exhibitor, or use Configure Lobby below to set up the event's booths."}
      </NoticeCard>
    );
  }

  if (action === "view_lobby") {
    const event = await getEventById(eventId);
    if (event?.friendly_url) {
      // Now a native route in this app (see src/app/virtual-event/[slug]/page.tsx) rather than
      // the legacy lobby.php, so this jumps straight there instead of out to PUBLIC_SITE_URL.
      // visit_photobooth isn't wired up on the new page yet (no Photo Booth page exists),
      // so that suffix is intentionally dropped here rather than passed to a page that ignores it.
      redirect(`/virtual-event/${event.friendly_url}`);
    }

    return (
      <NoticeCard title="Enter the Show" eventId={eventId}>
        This event doesn&apos;t have a public virtual-event page configured yet (missing friendly_url).
      </NoticeCard>
    );
  }

  const lobbies: LobbyRow[] = await getLobbies(context);

  return (
    <div className="section-transition space-y-6">
      <Breadcrumb eventId={eventId} />

      <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl">
        <LobbyManager
          lobbies={lobbies}
          eventId={eventId}
          initialAction={action}
          initialLobbyId={lobbyIdParam ? Number(lobbyIdParam) : undefined}
        />
      </div>
    </div>
  );
}

