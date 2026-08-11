/**
 * One-off backfill for rows already created by scripts/seed-member-menu.ts, needed now that
 * EventAdminNavbar reads find_event_menus live instead of its old hardcoded list
 * (src/lib/services/memberMenu.ts):
 *
 *  1. Sets all five role flags (visitor/organiser/exhibitor/sponsor/speaker) to TRUE on every
 *     existing row. The original seed marked everything organiser-only, which was correct as a
 *     snapshot of "who this menu is really for" but would have made exhibitor/sponsor/speaker/
 *     visitor accounts suddenly see empty menus the moment the live nav started reading this
 *     table — a real regression, since today (hardcoded nav) every role sees the full menu.
 *     All-true here reproduces that same "everyone sees it" behavior with real data instead.
 *  2. Backfills `attribute` (tab code, e.g. "LGTS") and `icon_mstr_cd` (tab icon name) per
 *     menu_group, so the live nav's tab colors/icons match the original hardcoded design
 *     instead of falling back to a generic style for every tab.
 *
 * Safe to re-run — every row's `attribute`/`icon_mstr_cd` and role flags are simply
 * overwritten, no rows are created or deleted.
 *
 * Run with:
 *   npx tsx scripts/fix-member-menu-data.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

const GROUP_META: Record<string, { code: string; icon: string }> = {
  "View Event Summary": { code: "LGTS", icon: "Menu" },
  "Setup Event": { code: "LGTMM", icon: "Settings" },
  "Configure Virtual Event": { code: "LGTCL", icon: "Wrench" },
  "Manage Events": { code: "LGTME", icon: "ListChecks" },
  "Manage Virtual Booth": { code: "LTGMVB", icon: "Video" },
  "Manage Event Orders": { code: "LGTBUY", icon: "ShoppingCart" },
  "Download Orders": { code: "LTGDO", icon: "ArrowDownCircle" },
};

async function main() {
  console.log("Backfilling find_event_menus role flags + tab metadata...");

  const rows = await prisma.find_event_menus.findMany({
    select: { id: true, menu_group: true },
  });

  let updated = 0;
  for (const row of rows) {
    const meta = row.menu_group ? GROUP_META[row.menu_group] : undefined;
    await prisma.find_event_menus.update({
      where: { id: row.id },
      data: {
        visitor: true,
        organiser: true,
        exhibitor: true,
        sponsor: true,
        speaker: true,
        ...(meta ? { attribute: meta.code, icon_mstr_cd: meta.icon } : {}),
      },
    });
    updated += 1;
  }

  console.log(`\nDone. Updated ${updated} row(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
