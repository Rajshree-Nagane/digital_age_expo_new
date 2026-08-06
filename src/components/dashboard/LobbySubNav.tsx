import Link from "next/link";

export type LobbyTabKey =
  | "parent"
  | "child"
  | "spots"
  | "spots_tabular"
  | "assets"
  | "welcome_tour"
  | "agenda"
  | "polling"
  | "templates"
  | "enquiries"
  | "networking";

const BASE = "/members";

export function LobbySubNav({
  eventId,
  childId,
  active,
}: {
  eventId: number | string;
  childId?: number | string;
  active: LobbyTabKey;
}) {
  const q = `event_id=${eventId}`;
  const spotsHref = childId ? `${BASE}/event_lobby_spots?${q}&child_id=${childId}` : `${BASE}/event_lobby_spots?${q}`;

  const tabs: { key: LobbyTabKey; label: string; href: string }[] = [
    { key: "parent", label: "Parent Lobby Details", href: `${BASE}/event_lobby_layout_manager?${q}` },
    { key: "child", label: "Child Lobby", href: `${BASE}/event_lobby_layout_child?${q}` },
    { key: "spots", label: "Spots", href: spotsHref },
    { key: "spots_tabular", label: "Spots (Tabular)", href: `${BASE}/event_lobby_spots_tabular?${q}` },
    { key: "assets", label: "Assets", href: `${BASE}/event_lobby_layout_type_assets?${q}` },
    { key: "welcome_tour", label: "Welcome Tour", href: `${BASE}/event_lobby_welcome_tour?${q}` },
    { key: "agenda", label: "Agenda", href: `${BASE}/event_lobby_agenda_items?${q}` },
    { key: "polling", label: "Polling", href: `${BASE}/event_lobby_polling?${q}` },
    { key: "templates", label: "Templates", href: `${BASE}/event_lobby_templates?${q}` },
    { key: "enquiries", label: "Visitor Enquiries", href: `${BASE}/event_lobby_visitor_enquires?${q}` },
    { key: "networking", label: "Networking Room", href: `${BASE}/event_networking_room?${q}` },
  ];

  return (
    <div className="mb-6 overflow-x-auto pb-2 border-b border-white/10">
      <div className="flex items-center gap-2 min-w-max">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-lg shadow-brand-pink/20 border border-white/20"
                  : "bg-black/40 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

