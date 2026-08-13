import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getEventByFriendlyUrl } from "@/lib/services/events";
import { getPublicLobby } from "@/lib/services/eventLobby";
import {
  getLobbyHotspots,
  getLobbyMenuGroups,
  findMenuGroupByTitle,
  getVisitorBriefcase,
  getLobbyFooterMenu,
  getExhibitorMenuExtras,
} from "@/lib/services/publicLobby";
import { getEventExhibitorDirectory } from "@/lib/services/exhibitors";
import { isLobbyVideoAsset, lobbyAssetUrl, staticAssetUrl } from "@/lib/assets";
import { LobbyTopBar } from "@/components/virtual-event/LobbyTopBar";
import { LobbyHotspots, type HotspotWithMenu } from "@/components/virtual-event/LobbyHotspots";
import { LobbyFooterNav, type FooterItem } from "@/components/virtual-event/LobbyFooterNav";

export const dynamic = "force-dynamic";

/**
 * Public /virtual-event/[slug] lobby — the Next.js native replacement for legacy lobby.php,
 * reached via /enter-the-show -> /virtual-event/[slug]/login -> here. Gated behind the site's
 * existing NextAuth member session (any authenticated find_users login — organiser, exhibitor,
 * speaker, or the "visitor" fallback role — may view it; see eventAccess.ts). Deliberately does
 * NOT use the "demo session" fallback pattern seen on member-area pages (e.g.
 * event_lobby_layout_manager/page.tsx's `?? { user: { id: "1", ... } }`) — that convenience
 * would let every unauthenticated visitor straight past the login gate, which is exactly what
 * this page exists to enforce.
 */
export default async function VirtualEventLobbyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventByFriendlyUrl(slug);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">Event Not Found</h1>
          <p className="mt-3 text-zinc-400">This virtual event link is no longer valid.</p>
        </div>
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/virtual-event/${slug}/login`);
  }

  const userId = Number(session.user.id);

  const [lobby, menuGroups, footerMenu, exhibitorExtras, exhibitorDirectory] = await Promise.all([
    getPublicLobby(event.id),
    getLobbyMenuGroups(event.id),
    getLobbyFooterMenu(event.id, slug),
    getExhibitorMenuExtras(event.id, userId),
    getEventExhibitorDirectory(event.id),
  ]);

  const [hotspotRows, briefcase] = await Promise.all([
    lobby ? getLobbyHotspots(event.id, lobby.id) : Promise.resolve([]),
    lobby ? getVisitorBriefcase(lobby.id, userId) : Promise.resolve([]),
  ]);

  const hotspots: HotspotWithMenu[] = hotspotRows.map((spot) => ({
    id: spot.id,
    title: spot.title,
    xPct: spot.xPct,
    yPct: spot.yPct,
    color: spot.color,
    children: findMenuGroupByTitle(menuGroups, spot.title)?.children ?? [],
  }));

  // The footer's own menu comes straight from find_event_lobby_menu (getLobbyFooterMenu) — the
  // one exception is "briefcase", which is a DB row with no children of its own; its live count
  // and contents come from getVisitorBriefcase() instead, same as lobby.php's separate
  // getBriefcaseAssets() call. Exhibitor/speaker-only items (View/Manage My Booth, Manage My
  // Sessions) are appended on top, mirroring getEventUserMenu().
  const footerItems: FooterItem[] = [
    ...footerMenu.map((item) =>
      item.kind === "briefcase"
        ? {
            ...item,
            count: briefcase.length,
            children: briefcase.map((b) => ({ id: b.id, title: b.title, href: b.url })),
            emptyLabel: "Your briefcase is empty.",
          }
        : item
    ),
    ...exhibitorExtras,
  ];

  const backgroundFile = lobby?.image ?? null;
  const backgroundUrl = lobbyAssetUrl(backgroundFile ?? undefined);
  const backgroundIsVideo = isLobbyVideoAsset(backgroundFile);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-zinc-950 text-white">
      <LobbyTopBar eventTitle={event.title} />

      {/* <div className="absolute inset-0">
        {backgroundUrl ? (
          backgroundIsVideo ? (
            <video src={backgroundUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backgroundUrl} alt={lobby?.title ?? event.title} className="h-full w-full object-cover" />
          )
        ) : (
          <div className="main-glow-bg h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/10 to-zinc-950/40" />
      </div> */}
<video
    className="w-full h-auto object-cover"
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
  >
    <source
      src={staticAssetUrl("https://digitalageexpo.com/files/lobby/event_47.mp4?revision=4aa25b9fb8b4163cbe17606b34b74288")}
      type="video/mp4"
    />
  </video>
      {!backgroundUrl && (
        <div className="relative z-10 flex h-full items-center justify-center px-6 pb-20 text-center">
          <div className="glass-panel max-w-md rounded-2xl p-8">
            <h1 className="text-2xl font-black uppercase text-white">{lobby?.title || event.title}</h1>
            <p className="mt-3 text-sm text-zinc-400">
              {lobby?.description ||
                "The lobby's background and hotspots haven't been configured yet — an organiser can set this up from Lobby Manager in the Members area."}
            </p>
          </div>
        </div>
      )}

      {backgroundUrl && <LobbyHotspots hotspots={hotspots} />}

      <LobbyFooterNav items={footerItems} exhibitors={exhibitorDirectory} />
    </div>
  );
}
