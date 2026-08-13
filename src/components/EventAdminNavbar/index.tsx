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

/* ============================================================
   TYPES
============================================================ */

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

interface EventAdminNavbarProps {
  tabs: MemberMenuTabData[];
  eventId?: number | string;
  defaultTab?: string;
  onOpenModal?: (modalId: string) => void;
}

/* ============================================================
   TAB ORDER
   ------------------------------------------------------------
   IMPORTANT:
   This controls the exact order in which the top menu tabs
   are displayed.

   Do NOT depend on database/SQL/default sorting.
============================================================ */

const TAB_ORDER = [
  "LGTS",     // View Event Summary
  "LGTMM",    // Setup Event
  "LGTCL",    // Configure Virtual Event
  "LGTME",    // Manage Events
  "LTGMVB",   // Manage Virtual Booth
  "LGTBUY",   // Manage Event Orders
  "LTGDO",    // Download Orders
];

/* ============================================================
   ICON MAP
============================================================ */

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

/* ============================================================
   RESOLVE ICON
============================================================ */

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Menu;
}

/* ============================================================
   ADD EVENT ID TO URL
============================================================ */

function withEventId(
  href: string,
  eventId: number | string
): string {
  if (!href || href === "#") {
    return href;
  }

  const separator = href.includes("?") ? "&" : "?";

  return `${href}${separator}event_id=${eventId}`;
}

/* ============================================================
   GET PATHNAME WITHOUT QUERY STRING
============================================================ */

function pathOf(href: string): string {
  return href.split("?")[0];
}

/* ============================================================
   GET TAB ORDER INDEX
============================================================ */

function getTabOrder(code: string): number {
  const index = TAB_ORDER.indexOf(code);

  // Unknown/new tabs go after all configured tabs.
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/* ============================================================
   RESOLVE + SORT TABS
   ------------------------------------------------------------
   This is the important part.

   Database can return:

   Configure
   Download
   Manage Events
   Setup
   View Event Summary

   But the UI will ALWAYS display:

   View Event Summary
   Setup Event
   Configure Virtual Event
   Manage Events
   Manage Virtual Booth
   Manage Event Orders
   Download Orders
============================================================ */

function resolveTabs(
  rawTabs: MemberMenuTabData[],
  eventId: number | string
): Tab[] {
  const resolvedTabs: Tab[] = rawTabs.map((tab) => ({
    code: tab.code,
    label: tab.label,
    icon: resolveIcon(tab.icon),

    items: tab.items.map((item) => ({
      title: item.title,

      href: item.isModal
        ? "#"
        : withEventId(item.href, eventId),

      icon: resolveIcon(item.icon),

      modal: item.isModal
        ? item.modalName ?? undefined
        : undefined,
    })),
  }));

  /*
   * Sort tabs according to TAB_ORDER.
   *
   * We do NOT sort alphabetically.
   * We do NOT use database order.
   */
  return [...resolvedTabs].sort(
    (a, b) =>
      getTabOrder(a.code) -
      getTabOrder(b.code)
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function EventAdminNavbar({
  tabs: rawTabs,
  eventId = DEFAULT_EVENT_ID,
  defaultTab,
  onOpenModal,
}: EventAdminNavbarProps) {
  /*
   * Resolve icons + event IDs + enforce exact menu order.
   */
  const tabs = resolveTabs(rawTabs, eventId);

  const pathname = usePathname();

  /* ==========================================================
     MODAL STATE
  ========================================================== */

  const [internalModalId, setInternalModalId] =
    useState<string | null>(null);

  const openModal = (modalId: string) => {
    if (onOpenModal) {
      onOpenModal(modalId);
    } else {
      setInternalModalId(modalId);
    }
  };

  /* ==========================================================
     FIND TAB FOR CURRENT PATH
  ========================================================== */

  function tabForPath(path: string): string | null {
    for (const tab of tabs) {
      const found = tab.items.some(
        (item) =>
          !item.modal &&
          pathOf(item.href) === path
      );

      if (found) {
        return tab.code;
      }
    }

    return null;
  }

  /* ==========================================================
     INITIAL ACTIVE TAB
  ========================================================== */

  const matchedTabOnMount = tabForPath(pathname);

  const [activeTab, setActiveTab] = useState(
    defaultTab ??
      matchedTabOnMount ??
      tabs[0]?.code ??
      ""
  );

  /* ==========================================================
     SYNC ACTIVE TAB WITH URL
  ========================================================== */

  useEffect(() => {
    const matchedTab = tabForPath(pathname);

    if (
      matchedTab &&
      matchedTab !== activeTab
    ) {
      setActiveTab(matchedTab);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* ==========================================================
     CURRENT TAB
  ========================================================== */

  const current =
    tabs.find(
      (tab) => tab.code === activeTab
    ) ?? tabs[0];

  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  if (!current) {
    return (
      <div className="w-full">
        <div className="rounded-xl border border-white/10 bg-black/40 p-8 text-center text-sm text-zinc-500 backdrop-blur-md">
          No menu items are configured for your role yet.
        </div>

        <CopyEventModal
          open={
            internalModalId ===
            "copyEventModal"
          }
          eventId={eventId}
          onClose={() =>
            setInternalModalId(null)
          }
        />
      </div>
    );
  }

  /* ==========================================================
     TAB COLORS
  ========================================================== */

  const getTabColors = (code: string) => {
    switch (code) {
      /* ---------------------------------------------
         VIEW EVENT SUMMARY
      --------------------------------------------- */

      case "LGTS":
        return {
          activeBg:
            "bg-brand-purple text-white border-brand-purple",

          hoverBg:
            "hover:bg-brand-purple/20 hover:text-white",

          textColor:
            "text-brand-purple",

          badgeBg:
            "bg-brand-purple/20 text-white border-brand-purple/30",

          cardHover:
            "hover:border-brand-purple/50 hover:bg-white/5 hover:text-white",

          cardActive:
            "bg-brand-purple/30 text-white border-brand-purple/50 ring-1 ring-brand-purple/30 font-bold",

          iconColor:
            "text-brand-purple",
        };

      /* ---------------------------------------------
         SETUP EVENT
      --------------------------------------------- */

      case "LGTMM":
        return {
          activeBg:
            "bg-brand-pink text-white border-brand-pink",

          hoverBg:
            "hover:bg-brand-pink/20 hover:text-white",

          textColor:
            "text-brand-pink",

          badgeBg:
            "bg-brand-pink/20 text-white border-brand-pink/30",

          cardHover:
            "hover:border-brand-pink/50 hover:bg-white/5 hover:text-white",

          cardActive:
            "bg-brand-pink/30 text-white border-brand-pink/50 ring-1 ring-brand-pink/30 font-bold",

          iconColor:
            "text-brand-pink",
        };

      /* ---------------------------------------------
         CONFIGURE VIRTUAL EVENT
      --------------------------------------------- */

      case "LGTCL":
        return {
          activeBg:
            "bg-brand-purple text-white border-brand-purple",

          hoverBg:
            "hover:bg-brand-purple/20 hover:text-white",

          textColor:
            "text-brand-purple",

          badgeBg:
            "bg-brand-purple/20 text-white border-brand-purple/30",

          cardHover:
            "hover:border-brand-purple/50 hover:bg-white/5 hover:text-white",

          cardActive:
            "bg-brand-purple/30 text-white border-brand-purple/50 ring-1 ring-brand-purple/30 font-bold",

          iconColor:
            "text-brand-purple",
        };

      /* ---------------------------------------------
         MANAGE EVENTS
      --------------------------------------------- */

      case "LGTME":
        return {
          activeBg:
            "bg-brand-pink text-white border-brand-pink",

          hoverBg:
            "hover:bg-brand-pink/20 hover:text-white",

          textColor:
            "text-brand-pink",

          badgeBg:
            "bg-brand-pink/20 text-white border-brand-pink/30",

          cardHover:
            "hover:border-brand-pink/50 hover:bg-white/5 hover:text-white",

          cardActive:
            "bg-brand-pink/30 text-white border-brand-pink/50 ring-1 ring-brand-pink/30 font-bold",

          iconColor:
            "text-brand-pink",
        };

      /* ---------------------------------------------
         MANAGE VIRTUAL BOOTH
      --------------------------------------------- */

      case "LTGMVB":
        return {
          activeBg:
            "bg-zinc-900 text-white border-zinc-800",

          hoverBg:
            "hover:bg-white/10 hover:text-white",

          textColor:
            "text-zinc-300",

          badgeBg:
            "bg-zinc-800 text-zinc-300 border-zinc-700",

          cardHover:
            "hover:border-zinc-700 hover:bg-white/5 hover:text-white",

          cardActive:
            "bg-zinc-800 text-white border-zinc-700 font-bold",

          iconColor:
            "text-zinc-400",
        };

      /* ---------------------------------------------
         MANAGE EVENT ORDERS
      --------------------------------------------- */

      case "LGTBUY":
        return {
          activeBg:
            "bg-brand-purple text-white border-brand-purple",

          hoverBg:
            "hover:bg-brand-purple/20 hover:text-white",

          textColor:
            "text-brand-purple",

          badgeBg:
            "bg-brand-purple/20 text-white border-brand-purple/30",

          cardHover:
            "hover:border-brand-purple/50 hover:bg-white/5 hover:text-white",

          cardActive:
            "bg-brand-purple/30 text-white border-brand-purple/50 ring-1 ring-brand-purple/30 font-bold",

          iconColor:
            "text-brand-purple",
        };

      /* ---------------------------------------------
         DOWNLOAD ORDERS
      --------------------------------------------- */

      case "LTGDO":
      default:
        return {
          activeBg:
            "bg-brand-pink text-white border-brand-pink",

          hoverBg:
            "hover:bg-brand-pink/20 hover:text-white",

          textColor:
            "text-brand-pink",

          badgeBg:
            "bg-brand-pink/20 text-white border-brand-pink/30",

          cardHover:
            "hover:border-brand-pink/50 hover:bg-white/5 hover:text-white",

          cardActive:
            "bg-brand-pink/30 text-white border-brand-pink/50 ring-1 ring-brand-pink/30 font-bold",

          iconColor:
            "text-brand-pink",
        };
    }
  };

  const currentTabColors =
    getTabColors(current.code);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="w-full">

      {/* ======================================================
          TOP TAB BAR
      ======================================================= */}

      <div
        className="
          flex
          flex-wrap
          overflow-hidden
          rounded-xl
          border
          border-white/10
          bg-black/40
          shadow-2xl
          backdrop-blur-md
        "
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;

          const isActive =
            tab.code === activeTab;

          const tabStyle =
            getTabColors(tab.code);

          return (
            <button
              key={tab.code}
              type="button"
              onClick={() =>
                setActiveTab(tab.code)
              }
              title={tab.label}
              className={`
                flex
                min-w-[100px]
                flex-1
                basis-[120px]
                items-center
                justify-center
                gap-1.5
                overflow-hidden
                border-r
                border-white/5
                px-2
                py-2.5
                text-[10px]
                font-bold
                uppercase
                tracking-tight
                transition-all
                duration-200
                last:border-r-0
                focus:outline-none

                sm:gap-2
                sm:px-3
                sm:text-[11px]
                sm:tracking-wide

                ${
                  isActive
                    ? `
                      ${tabStyle.activeBg}
                      font-black
                      shadow-lg
                      scale-[1.02]
                      z-10
                    `
                    : `
                      text-zinc-400
                      ${tabStyle.hoverBg}
                    `
                }
              `}
            >
              <Icon
                size={13}
                className={`
                  shrink-0
                  ${
                    isActive
                      ? "text-white"
                      : tabStyle.iconColor
                  }
                `}
              />

              <span className="truncate">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ======================================================
          SUB MENU PANEL
      ======================================================= */}

      <div
        className="
          mt-6
          rounded-xl
          border
          border-white/10
          bg-white/5
          p-6
          shadow-2xl
          backdrop-blur-lg
        "
      >

        {/* ----------------------------------------------------
            PANEL HEADER
        ----------------------------------------------------- */}

        <div
          className="
            mb-6
            flex
            items-center
            justify-between
            border-b
            border-white/10
            pb-4
          "
        >
          <div className="flex items-center gap-3">

            <span
              className={`
                inline-flex
                items-center
                rounded-full
                border
                px-3
                py-1
                text-[10px]
                font-extrabold
                uppercase
                tracking-widest
                ${currentTabColors.badgeBg}
              `}
            >
              {current.label}
            </span>

            <span className="text-xs font-medium text-zinc-500">
              {current.items.length}{" "}
              {current.items.length === 1
                ? "option"
                : "options"}{" "}
              available
            </span>

          </div>
        </div>

        {/* ----------------------------------------------------
            NO ITEMS
        ----------------------------------------------------- */}

        {current.items.length === 0 ? (
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              py-12
              text-center
            "
          >
            <span
              className="
                text-sm
                font-medium
                italic
                text-zinc-500
              "
            >
              No options available in this section yet.
            </span>
          </div>
        ) : (

          /* --------------------------------------------------
             SUB ITEMS
          --------------------------------------------------- */

          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
            "
          >
            {current.items.map((item) => {
              const Icon = item.icon;

              const isCurrentPage =
                !item.modal &&
                pathOf(item.href) === pathname;

              const classes = `
                flex
                items-center
                gap-3
                rounded-xl
                border
                px-5
                py-4
                text-xs
                font-semibold
                tracking-wide
                shadow-lg
                transition-all
                duration-300

                hover:shadow-brand-purple/10

                ${
                  isCurrentPage
                    ? currentTabColors.cardActive
                    : `
                      border-white/10
                      bg-zinc-900/50
                      text-zinc-300
                      ${currentTabColors.cardHover}
                    `
                }
              `;

              /* --------------------------------------------
                 MODAL ITEM
              --------------------------------------------- */

              if (item.modal) {
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() =>
                      openModal(item.modal!)
                    }
                    className={classes}
                  >
                    <Icon
                      size={14}
                      className={
                        isCurrentPage
                          ? "text-white"
                          : currentTabColors.iconColor
                      }
                    />

                    <span
                      className="truncate"
                      title={item.title}
                    >
                      {item.title}
                    </span>
                  </button>
                );
              }

              /* --------------------------------------------
                 EXTERNAL URL
              --------------------------------------------- */

              const isExternal =
                item.href.startsWith("http");

              if (isExternal) {
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    title={item.title}
                    className={classes}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon
                      size={14}
                      className={
                        isCurrentPage
                          ? "text-white"
                          : currentTabColors.iconColor
                      }
                    />

                    <span className="truncate">
                      {item.title}
                    </span>
                  </a>
                );
              }

              /* --------------------------------------------
                 INTERNAL NEXT.JS LINK
              --------------------------------------------- */

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  title={item.title}
                  className={classes}
                >
                  <Icon
                    size={14}
                    className={
                      isCurrentPage
                        ? "text-white"
                        : currentTabColors.iconColor
                    }
                  />

                  <span className="truncate">
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================
          COPY EVENT MODAL
      ======================================================= */}

      <CopyEventModal
        open={
          internalModalId ===
          "copyEventModal"
        }
        eventId={eventId}
        onClose={() =>
          setInternalModalId(null)
        }
      />
    </div>
  );
}