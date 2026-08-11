import { prisma } from "@/lib/prisma";
import type { EventRole } from "@/lib/services/eventAccess";

export interface MemberMenuItemData {
  title: string;
  href: string;
  /** Lucide icon name, e.g. "Menu" — resolved to a component client-side (EventAdminNavbar). */
  icon: string;
  isModal: boolean;
  modalName: string | null;
}

export interface MemberMenuTabData {
  /** Legacy tab code (e.g. "LGTS") backfilled into find_event_menus.attribute — used to pick a
   * matching color scheme in EventAdminNavbar. Falls back to the group label if unset. */
  code: string;
  label: string;
  /** Lucide icon name for the tab pill itself, backfilled into find_event_menus.icon_mstr_cd. */
  icon: string;
  items: MemberMenuItemData[];
}

const ROLE_COLUMN = {
  visitor: "visitor",
  organiser: "organiser",
  exhibitor: "exhibitor",
  sponsor: "sponsor",
  speaker: "speaker",
} as const;

/**
 * Live data source for the members-dashboard nav (src/components/EventAdminNavbar), replacing
 * what used to be a fully hardcoded tab/item list in that component. Reads find_event_menus,
 * scoped to the signed-in member's real role.
 *
 * "Safe default" rule: an item with ALL FIVE role flags false is treated as visible to every
 * role, not nobody. This mirrors the existing convention already used elsewhere in this app —
 * user_event_summary/page.tsx's ACTION_MENUS and components/dashboard/EventAdminNavbar.tsx's
 * NAV_ITEMS both treat "no roles listed" as "show to everyone" — and matters here because it's
 * what makes turning this on non-breaking: every row seeded so far has all five flags TRUE
 * (everyone sees it, same as the old hardcoded nav did for every role), and the CP's "Add Item"
 * form defaults every role checkbox to checked, so an admin has to deliberately narrow an item
 * to specific roles rather than accidentally hiding it from everyone else.
 */
export async function getLiveMemberMenu(role: EventRole): Promise<MemberMenuTabData[]> {
  const column = ROLE_COLUMN[role];

  const rows = await prisma.find_event_menus.findMany({
    where: {
      visible: true,
      OR: [
        { [column]: true },
        { visitor: false, organiser: false, exhibitor: false, sponsor: false, speaker: false },
      ],
    },
    orderBy: [{ menu_group: "asc" }, { sequence: "asc" }],
  });

  const tabsByGroup = new Map<string, MemberMenuTabData>();
  for (const row of rows) {
    const label = row.menu_group?.trim() || "Other";
    let tab = tabsByGroup.get(label);
    if (!tab) {
      tab = {
        code: row.attribute?.trim() || label,
        label,
        icon: row.icon_mstr_cd?.trim() || row.icon,
        items: [],
      };
      tabsByGroup.set(label, tab);
    }
    tab.items.push({
      title: row.title?.trim() || row.page_name,
      href: row.link,
      icon: row.icon,
      isModal: row.is_modal === 1,
      modalName: row.modal_name,
    });
  }

  return Array.from(tabsByGroup.values());
}
