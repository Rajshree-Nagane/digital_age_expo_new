import type { ReactNode } from "react";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { SettingsNav } from "./_components/SettingsNav";

/**
 * Shared shell for every /cp/settings/* page. This is the single view-permission gate for the
 * whole module (each sub-page no longer repeats its own requireCpPermission(SETTINGS_VIEW) call
 * — a Next.js layout always runs before its children, so this redirect fires before any child
 * page starts rendering or querying). Note this only covers *reads*: every Server Action that
 * mutates a setting still calls requireCpPermission(SETTINGS_EDIT) itself, independently — a
 * Server Action is reachable directly (not just via this page tree), so view-only admins can't
 * be relied on to be blocked by a layout they never route through.
 */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_VIEW);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your website information, branding, contact details, theme, SEO and global configuration.
        </p>
      </div>
      <SettingsNav />
      {children}
    </div>
  );
}
