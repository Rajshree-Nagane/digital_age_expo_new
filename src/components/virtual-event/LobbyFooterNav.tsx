"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  Building2,
  DoorOpen,
  Users,
  Briefcase,
  LifeBuoy,
  ExternalLink,
  Circle,
  type LucideIcon,
} from "lucide-react";
import { ExhibitorListModal, type ExhibitorDirectoryEntry } from "@/components/virtual-event/ExhibitorListModal";

/** Fallback icon shown when a menu row has no icon_path configured yet — keyed off
 * find_event_lobby_menu.post_action_type ("kind"), not a fixed per-item icon set, since the
 * real icon almost always comes from the organiser-uploaded image (see getLobbyFooterMenu). */
const FALLBACK_ICON_BY_KIND: Record<string, LucideIcon> = {
  lobby: Home,
  layout: Building2,
  chat: LifeBuoy,
  briefcase: Briefcase,
  exhibitor_list: Users,
  "my-booth": DoorOpen,
  "manage-booth": DoorOpen,
  "manage-sessions": DoorOpen,
  asset: ExternalLink,
  link: ExternalLink,
};

export interface FooterChild {
  id: number | string;
  title: string;
  href: string | null;
}

export interface FooterItem {
  key?: string;
  id?: number | string;
  label?: string;
  title?: string;
  iconUrl?: string;
  kind?: string;
  href?: string | null;
  external?: boolean;
  count?: number | null;
  children?: FooterChild[];
  emptyLabel?: string;
}

/**
 * The bottom nav bar (Home / Auditorium (6) / Photo Booth / Exhibitor List / Networking /
 * Briefcase (0) / Support / ...), mirroring lobby.php's getEventMenu() + getEventUserMenu()
 * footer and lobby.tpl's `.footer-nav { position: fixed; bottom: 0; width: 100%; }` — the legacy
 * lobby's *only* footer, always pinned to the screen. Fixed to the viewport here too (not just
 * the lobby's own <div>) so it stays visible and stuck to the bottom regardless of page scroll —
 * see ChromeGate, which hides the marketing site's <Footer /> on this route so the two don't
 * stack.
 *
 * Every item's icon, label, count and dropdown contents come from real data (publicLobby.ts's
 * getLobbyFooterMenu/getExhibitorMenuExtras — themselves reads of find_event_lobby_menu /
 * find_event_exhibitor / find_speakers), not a hardcoded guess at what a lobby footer "usually"
 * has — an organiser-uploaded icon image renders as-is; only a genuinely iconless row falls back
 * to a generic Lucide glyph. Items with a real destination are Links, everything else (including
 * anything with sub-items) opens a small dropdown instead.
 */
export function LobbyFooterNav({
  items,
  exhibitors = [],
}: {
  items: FooterItem[];
  /** Powers the "Exhibitor List" item's modal (see ExhibitorListModal) — omitted entirely when
   *  the caller has no exhibitor data to give it, in which case that item just falls back to
   *  its normal href/dropdown behavior below. */
  exhibitors?: ExhibitorDirectoryEntry[];
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [showExhibitorList, setShowExhibitorList] = useState(false);

  return (
    <>
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pt-8">
      <div className="border-t border-white/10 bg-zinc-950/90 backdrop-blur-md">
        <ul className="mx-auto flex max-w-5xl items-stretch justify-start gap-0.5 overflow-x-auto px-2 sm:justify-center sm:gap-1">
          {items.map((item, index) => {
            const itemKey = String(item.key ?? item.id ?? index);
            const label = item.label ?? item.title ?? "";
            const FallbackIcon = FALLBACK_ICON_BY_KIND[item.kind ?? ""] ?? Circle;
            const opensExhibitorModal = item.kind === "exhibitor_list" && exhibitors.length > 0;
            const hasChildren = !!item.children?.length;
            const isDropdown = !opensExhibitorModal && (hasChildren || !item.href);
            const isOpen = openKey === itemKey;

            const content = (
              <>
                {item.iconUrl ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-110">
                    {/* eslint-disable-next-line @next/next/no-img-element -- organiser-uploaded, arbitrary remote host */}
                    <img src={item.iconUrl} alt="" className="h-5 w-5 object-contain" />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-200 group-hover:scale-110">
                    <FallbackIcon className="h-4 w-4" />
                  </span>
                )}
                <span className="mt-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide sm:text-[11px]">
                  {label}
                  {typeof item.count === "number" ? ` (${item.count})` : ""}
                </span>
              </>
            );

            const buttonClass =
              "group flex flex-shrink-0 flex-col items-center justify-center gap-1 px-3.5 py-3 text-white/80 transition hover:text-brand-pink sm:px-4";

            return (
              <li key={itemKey} className="relative flex-shrink-0">
                {opensExhibitorModal ? (
                  <button type="button" onClick={() => setShowExhibitorList(true)} className={buttonClass}>
                    {content}
                  </button>
                ) : isDropdown ? (
                  <button
                    type="button"
                    onClick={() => setOpenKey(isOpen ? null : itemKey)}
                    className={buttonClass}
                  >
                    {content}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                    className={buttonClass}
                  >
                    {content}
                  </Link>
                )}

                {isDropdown && isOpen && (
                  <div className="submenu-dropdown absolute bottom-full left-1/2 mb-3 w-56 -translate-x-1/2 rounded-xl p-2">
                    {hasChildren ? (
                      <ul className="space-y-0.5">
                        {item.children!.map((child) => (
                          <li key={child.id}>
                            {child.href ? (
                              <Link
                                href={child.href}
                                onClick={() => setOpenKey(null)}
                                className="block rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-pink/15 hover:text-brand-pink"
                              >
                                {child.title}
                              </Link>
                            ) : (
                              <span
                                title="Coming soon"
                                className="block cursor-default rounded-lg px-3 py-2 text-sm font-medium text-zinc-500"
                              >
                                {child.title}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-3 py-2 text-xs text-zinc-400">{item.emptyLabel ?? "Coming soon."}</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
    <ExhibitorListModal
      open={showExhibitorList}
      onClose={() => setShowExhibitorList(false)}
      exhibitors={exhibitors}
    />
    </>
  );
}
