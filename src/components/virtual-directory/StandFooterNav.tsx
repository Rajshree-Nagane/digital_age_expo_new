import Link from "next/link";
import {
  Home,
  Presentation,
  Camera,
  Store,
  Users,
  Briefcase,
  List,
  GraduationCap,
  Mic2,
  HelpCircle,
  DoorOpen,
  Settings,
  Mic,
  type LucideIcon,
} from "lucide-react";

interface FooterNavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
}

/**
 * Mirrors the legacy lobby's bottom icon strip (Home / Auditorium / Photo Booth / Exhibition /
 * Networking / Briefcase / Exhibitor List / Workshops / Presentations & Interviews / Support /
 * View My Booth / Manage My Booth / Manage My Sessions). Only the items that have a real
 * destination in this app are clickable — the rest of the lobby (auditoriums, photo booth,
 * networking rooms, briefcase, workshops, live support chat) hasn't been rebuilt natively yet, so
 * those render as muted, non-interactive labels instead of dead links.
 */
export function StandFooterNav({ eventId, exId }: { eventId: number; exId: number }) {
  const items: FooterNavItem[] = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Auditorium", icon: Presentation },
    { label: "Photo Booth", icon: Camera },
    { label: "Exhibition", icon: Store, href: "/exhibitors" },
    { label: "Networking", icon: Users },
    { label: "Briefcase", icon: Briefcase },
    { label: "Exhibitor List", icon: List, href: "/exhibitors" },
    { label: "Workshops", icon: GraduationCap },
    { label: "Presentations & Interviews", icon: Mic2 },
    { label: "Support", icon: HelpCircle },
    {
      label: "View My Booth",
      icon: DoorOpen,
      href: `/members/event_lobby_layout_manager?action=view_my_booth&event_id=${eventId}&ex_id=${exId}`,
    },
    {
      label: "Manage My Booth",
      icon: Settings,
      href: `/members/manage_stand_assets?event_id=${eventId}&ex_id=${exId}`,
    },
    { label: "Manage My Sessions", icon: Mic },
  ];

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/85 backdrop-blur-md">
      <div className="flex items-stretch gap-1 overflow-x-auto px-3 py-2 sm:justify-center sm:gap-2">
        {items.map((item) => {
          const content = (
            <>
              <item.icon className="h-4 w-4" />
              <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wide">
                {item.label}
              </span>
            </>
          );
          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {content}
            </Link>
          ) : (
            <span
              key={item.label}
              title="Coming soon"
              className="flex flex-shrink-0 cursor-default flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-white/30"
            >
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
