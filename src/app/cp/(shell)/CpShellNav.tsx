import Link from "next/link";
import * as Icons from "lucide-react";
import type { find_dashboard_menu } from "@/generated/prisma";

/**
 * find_dashboard_menu.icon stores plain names (legacy admin CP used a different icon font,
 * but this column's values are simple words like "settings", "users", "menu" — mapped
 * loosely onto lucide-react equivalents; falls back to a generic square icon for anything
 * unmapped rather than failing to render).
 */
function resolveIcon(name: string) {
  const key = name.trim().toLowerCase();
  const map: Record<string, keyof typeof Icons> = {
    settings: "Settings",
    users: "Users",
    user: "Users",
    events: "Calendar",
    event: "Calendar",
    menu: "Menu",
    email: "Mail",
    mail: "Mail",
    media: "Image",
    pages: "FileText",
    cms: "FileText",
    dashboard: "LayoutDashboard",
    home: "LayoutDashboard",
  };
  const iconName = map[key];
  const Icon = (iconName && Icons[iconName]) || Icons.SquareDashed;
  return Icon as React.ComponentType<{ className?: string }>;
}

export function CpShellNav({ items }: { items: find_dashboard_menu[] }) {
  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-white/10 bg-zinc-900/60">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <span className="text-sm font-black uppercase tracking-wider text-white">Admin CP</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.length === 0 && (
          <p className="px-3 py-2 text-xs text-zinc-600">
            No menu items yet — run the seed script (src/app/cp/_scripts/seed.ts).
          </p>
        )}
        {items.map((item) => {
          const Icon = resolveIcon(item.icon);
          return (
            <Link
              key={item.id}
              href={item.link.startsWith("/") ? item.link : `/cp/${item.link}`}
              target={item.target || undefined}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
