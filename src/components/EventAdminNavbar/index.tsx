"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CopyEventModal } from "@/components/dashboard/CopyEventModal";
import {
  Menu,
  Settings,
  Settings2,
  Wrench,
  ListChecks,
  Video,
  ShoppingCart,
  ArrowDownCircle,
  Eye,
  Mail,
  Inbox,
  ZoomOut,
  Info,
  Indent,
  HelpCircle,
  Newspaper,
  Rss,
  Ticket,
  Calendar,
  Copy,
  Building,
  Building2,
  CircleDot,
  Coffee,
  ListOrdered,
  BookOpen,
  Square,
  Bell,
  Users,
  FileText,
  Files,
  Factory,
  Bold,
  UserPlus,
  LineChart,
  Mic,
  Map,
  Tv,
  Download,
  AlignCenter,
  Edit,
  ArrowDownWideNarrow,
  Image as ImageIcon,
  Clapperboard,
  CheckSquare,
  Quote,
  Target,
  Briefcase,
  Database,
  Film,
  List,
  StickyNote,
  Home,
  Megaphone,
  Bookmark,
  Gem,
  Languages,
  PenTool,
  ChevronDown,
  ChevronsDown,
  type LucideIcon,
} from "lucide-react";
import { DEFAULT_EVENT_ID } from "@/lib/site-config";
import type { MemberMenuTabData } from "@/lib/services/memberMenu";

/** ---------- Types ---------- */

interface SubItem {
  title: string;
  href: string;
  icon: LucideIcon;
  modal?: string;
}

interface Tab {
  code: string;
  label: string;
  icon: LucideIcon;
  items: SubItem[];
}

/**
 * find_event_menus stores icons as plain string names (e.g. "Menu") rather than component
 * references — component references aren't serializable across the Server → Client Component
 * boundary, so the server (getLiveMemberMenu) can only ever hand this component strings. This
 * map resolves those names back to the actual Lucide components, using the exact same icon set
 * the old hardcoded tab/item list used.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Menu,
  Settings,
  Settings2,
  Wrench,
  ListChecks,
  Video,
  ShoppingCart,
  ArrowDownCircle,
  Eye,
  Mail,
  Inbox,
  ZoomOut,
  Info,
  Indent,
  HelpCircle,
  Newspaper,
  Rss,
  Ticket,
  Calendar,
  Copy,
  Building,
  Building2,
  CircleDot,
  Coffee,
  ListOrdered,
  BookOpen,
  Square,
  Bell,
  Users,
  FileText,
  Files,
  Factory,
  Bold,
  UserPlus,
  LineChart,
  Mic,
  Map,
  Tv,
  Download,
  AlignCenter,
  Edit,
  ArrowDownWideNarrow,
  Image: ImageIcon,
  Clapperboard,
  CheckSquare,
  Quote,
  Target,
  Briefcase,
  Database,
  Film,
  List,
  StickyNote,
  Home,
  Megaphone,
  Bookmark,
  Gem,
  Languages,
  PenTool,
  ChevronDown,
  ChevronsDown,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Menu;
}

/**
 * find_event_menus.link is stored generically (no event scoping baked in, so the same row works
 * for every event) — this appends `event_id` at render time instead, preserving any existing
 * query string (e.g. "?action=view_my_booth") rather than clobbering it.
 */
function withEventId(href: string, eventId: number | string): string {
  if (!href || href === "#") return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}event_id=${eventId}`;
}

/** Converts the raw rows from getLiveMemberMenu (icon names as strings) into what the rest of
 * this component renders (resolved icon components, event-scoped hrefs). */
function resolveTabs(rawTabs: MemberMenuTabData[], eventId: number | string): Tab[] {
  return rawTabs.map((tab) => ({
    code: tab.code,
    label: tab.label,
    icon: resolveIcon(tab.icon),
    items: tab.items.map((item) => ({
      title: item.title,
      href: item.isModal ? "#" : withEventId(item.href, eventId),
      icon: resolveIcon(item.icon),
      modal: item.isModal ? item.modalName ?? undefined : undefined,
    })),
  }));
}

/** Get pathname without query parameters */
function pathOf(href: string) {
  return href.split("?")[0];
}

/** ---------- Component Props ---------- */

interface EventAdminNavbarProps {
  /**
   * Resolved server-side by getLiveMemberMenu() (src/lib/services/memberMenu.ts) from
   * find_event_menus, already scoped to the signed-in member's role — this component no longer
   * carries its own hardcoded tab/item list.
   */
  tabs: MemberMenuTabData[];

  /**
   * Event ID is optional.
   * If not provided, DEFAULT_EVENT_ID (852) will be used automatically.
   */
  eventId?: number | string;

  /**
   * Optional tab to open initially.
   */
  defaultTab?: string;

  /**
   * Callback for modal-triggered items.
   */
  onOpenModal?: (modalId: string) => void;
}

/** ---------- Component ---------- */

export default function EventAdminNavbar({
  tabs: rawTabs,
  eventId = DEFAULT_EVENT_ID,
  defaultTab,
  onOpenModal,
}: EventAdminNavbarProps) {
  const tabs = resolveTabs(rawTabs, eventId);
  const pathname = usePathname();

  /**
   * Falls back to managing its own modal state when no `onOpenModal` is supplied by the parent —
   * so "Copy Event" works out of the box on every page that renders this navbar, without every
   * caller (both `(event)/layout.tsx` and `user_event_summary/page.tsx`) needing to wire it up.
   */
  const [internalModalId, setInternalModalId] = useState<string | null>(null);
  const openModal = (modalId: string) => {
    if (onOpenModal) {
      onOpenModal(modalId);
    } else {
      setInternalModalId(modalId);
    }
  };

  /**
   * Find which tab contains the current page.
   */
  function tabForPath(path: string): string | null {
    for (const tab of tabs) {
      if (
        tab.items.some(
          (item) =>
            !item.modal &&
            pathOf(item.href) === path
        )
      ) {
        return tab.code;
      }
    }

    return null;
  }

  /**
   * Determine the initial active tab.
   *
   * Priority:
   * 1. defaultTab
   * 2. Current URL pathname
   * 3. First tab
   */
  const matchedTabOnMount = tabForPath(pathname);
  const [activeTab, setActiveTab] = useState(
    defaultTab ?? matchedTabOnMount ?? tabs[0]?.code ?? ""
  );

  /**
   * Keep active tab synchronized with URL changes.
   *
   * We only trigger this if the pathname actually changes,
   * allowing manual tab switching to persist until a new page is loaded.
   */
  useEffect(() => {
    const matchedTab = tabForPath(pathname);
    if (matchedTab && matchedTab !== activeTab) {
      setActiveTab(matchedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /**
   * Get currently selected tab.
   */
  const current =
    tabs.find((tab) => tab.code === activeTab) ??
    tabs[0];

  // No items configured for this role at all (e.g. a brand-new role with nothing assigned to it
  // yet in CP → Member Menu Manager) — render a friendly empty state instead of crashing on
  // `current.code` below.
  if (!current) {
    return (
      <div className="w-full">
        <div className="rounded-xl border border-white/10 bg-black/40 p-8 text-center text-sm text-zinc-500 backdrop-blur-md">
          No menu items are configured for your role yet.
        </div>
        <CopyEventModal
          open={internalModalId === "copyEventModal"}
          eventId={eventId}
          onClose={() => setInternalModalId(null)}
        />
      </div>
    );
  }

  const getTabColors = (code: string) => {
    switch (code) {
      case "LGT_ONBOARD":
        return {
          activeBg: "bg-indigo-600 text-white border-indigo-600",
          hoverBg: "hover:bg-indigo-600/20 hover:text-white",
          textColor: "text-indigo-400",
          badgeBg: "bg-indigo-600/20 text-white border-indigo-600/30",
          cardHover: "hover:border-indigo-600/50 hover:bg-white/5 hover:text-white",
          cardActive: "bg-indigo-600/30 text-white border-indigo-600/50 ring-1 ring-indigo-600/30 font-bold",
          iconColor: "text-indigo-400",
        };
      case "LGTS":
      case "LGTCL":
      case "LGTBUY":
        return {
          activeBg: "bg-brand-purple text-white border-brand-purple",
          hoverBg: "hover:bg-brand-purple/20 hover:text-white",
          textColor: "text-brand-purple",
          badgeBg: "bg-brand-purple/20 text-white border-brand-purple/30",
          cardHover: "hover:border-brand-purple/50 hover:bg-white/5 hover:text-white",
          cardActive: "bg-brand-purple/30 text-white border-brand-purple/50 ring-1 ring-brand-purple/30 font-bold",
          iconColor: "text-brand-purple",
        };
      case "LTGMVB":
        return {
          activeBg: "bg-zinc-900 text-white border-zinc-800",
          hoverBg: "hover:bg-white/10 hover:text-white",
          textColor: "text-zinc-300",
          badgeBg: "bg-zinc-800 text-zinc-300 border-zinc-700",
          cardHover: "hover:border-zinc-700 hover:bg-white/5 hover:text-white",
          cardActive: "bg-zinc-800 text-white border-zinc-700 font-bold",
          iconColor: "text-zinc-400",
        };
      case "LGTMM":
      case "LGTME":
      case "LTGDO":
      default:
        return {
          activeBg: "bg-brand-pink text-white border-brand-pink",
          hoverBg: "hover:bg-brand-pink/20 hover:text-white",
          textColor: "text-brand-pink",
          badgeBg: "bg-brand-pink/20 text-white border-brand-pink/30",
          cardHover: "hover:border-brand-pink/50 hover:bg-white/5 hover:text-white",
          cardActive: "bg-brand-pink/30 text-white border-brand-pink/50 ring-1 ring-brand-pink/30 font-bold",
          iconColor: "text-brand-pink",
        };
    }
  };

  const currentTabColors = getTabColors(current.code);

  return (
    <div className="w-full">
      {/* =====================================================
          TOP TAB / PILL BAR
      ====================================================== */}
      <div className="flex flex-wrap overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-2xl transition-all duration-300 backdrop-blur-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.code === activeTab;
          const tabStyle = getTabColors(tab.code);

          return (
            <button
              key={tab.code}
              type="button"
              onClick={() => setActiveTab(tab.code)}
              title={tab.label}
              className={`
                flex min-w-[100px] flex-1 basis-[120px] items-center
                justify-center gap-1.5 overflow-hidden border-r
                border-white/5 px-2 py-2.5
                text-[10px] font-bold uppercase
                tracking-tight transition-all duration-200
                last:border-r-0 focus:outline-none sm:gap-2 sm:px-3
                sm:text-[11px] sm:tracking-wide
                ${
                  isActive
                    ? `${tabStyle.activeBg} font-black shadow-lg scale-[1.02] z-10`
                    : `text-zinc-400 ${tabStyle.hoverBg}`
                }
              `}
            >
              <Icon size={13} className={`shrink-0 ${isActive ? "text-white" : tabStyle.iconColor}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================
          SUB ITEM PANEL
      ====================================================== */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 shadow-2xl transition-all duration-300 backdrop-blur-lg">
        {/* Panel Header */}
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${currentTabColors.badgeBg}`}>
              {current.label}
            </span>
            <span className="text-xs font-medium text-zinc-500">
              {current.items.length} {current.items.length === 1 ? "option" : "options"} available
            </span>
          </div>
        </div>

        {current.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-sm font-medium text-zinc-500 italic">
              No options available in this section yet.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {current.items.map((item) => {
              const Icon = item.icon;
              const isCurrentPage = !item.modal && pathOf(item.href) === pathname;

              // Build button/link classes.
              const classes = `
                flex items-center gap-3
                rounded-xl border px-5 py-4
                text-xs font-semibold tracking-wide
                transition-all duration-300
                shadow-lg hover:shadow-brand-purple/10
                ${
                  isCurrentPage
                    ? currentTabColors.cardActive
                    : `bg-zinc-900/50 text-zinc-300 border-white/10 ${currentTabColors.cardHover}`
                }
              `;

              // Modal trigger item (like Copy Event)
              if (item.modal) {
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => openModal(item.modal!)}
                    className={classes}
                  >
                    <Icon size={14} className={isCurrentPage ? "text-white" : currentTabColors.iconColor} />
                    <span className="truncate" title={item.title}>{item.title}</span>
                  </button>
                );
              }

              // External URL
              const isExternal = item.href.startsWith("http");
              if (isExternal) {
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    title={item.title}
                    className={classes}
                  >
                    <Icon size={14} className={isCurrentPage ? "text-white" : currentTabColors.iconColor} />
                    <span className="truncate">{item.title}</span>
                  </a>
                );
              }

              // Internal Next.js Link
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  title={item.title}
                  className={classes}
                >
                  <Icon size={14} className={isCurrentPage ? "text-white" : currentTabColors.iconColor} />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CopyEventModal
        open={internalModalId === "copyEventModal"}
        eventId={eventId}
        onClose={() => setInternalModalId(null)}
      />
    </div>
  );
}
