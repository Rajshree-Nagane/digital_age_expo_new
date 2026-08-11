"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/cp/settings/general", label: "General" },
  { href: "/cp/settings/contact", label: "Contact" },
  { href: "/cp/settings/company", label: "Company" },
  { href: "/cp/settings/branding", label: "Branding" },
  { href: "/cp/settings/theme", label: "Theme" },
  { href: "/cp/settings/typography", label: "Typography" },
  { href: "/cp/settings/social", label: "Social Media" },
  { href: "/cp/settings/seo", label: "SEO" },
  { href: "/cp/settings/website", label: "Website" },
  { href: "/cp/settings/footer", label: "Footer" },
] as const;

/**
 * Tab bar tying together every Settings sub-page — none of the original 5 pages (general/
 * company/branding/social/theme) had any shared navigation between them; each was only
 * reachable if you already knew its URL. Scrolls horizontally on small screens instead of
 * wrapping, so it stays usable on mobile without needing a separate collapsed-menu variant.
 */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              "shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors " +
              (active
                ? "bg-brand-pink text-white shadow-lg shadow-brand-pink/20"
                : "text-zinc-500 hover:bg-white/5 hover:text-white")
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
