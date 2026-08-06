"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Bell, CalendarClock, Store, Info, FileText } from "lucide-react";
import type { EventRole } from "@/lib/services/eventAccess";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Users;
  roles?: EventRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/my-event/team-members", label: "Team Members", icon: Users },
  { href: "/dashboard/my-event/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/my-event/meetings", label: "Scheduled Meetings", icon: CalendarClock },
  { href: "/dashboard/my-event/stand", label: "My Stand", icon: Store, roles: ["exhibitor"] },
  { href: "/dashboard/my-event/show-info", label: "Show Info", icon: Info },
  { href: "/dashboard/my-event/about-us", label: "About Show", icon: FileText, roles: ["organiser"] },
];

interface Props {
  role: EventRole;
}

/** Shared nav for the signed-in member's event-scoped pages (mirrors getEventHeader() across members/event_*.php). */
export function EventAdminNavbar({ role }: Props) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <nav className="flex flex-wrap gap-1 border-b border-indigo-950/10 pb-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
              active ? "bg-indigo-950 text-white" : "text-indigo-950/70 hover:bg-indigo-950/5"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
