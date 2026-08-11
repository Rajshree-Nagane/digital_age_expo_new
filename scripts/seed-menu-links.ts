/**
 * One-time seed: writes this site's real header navigation (DEFAULT_MENU, the hardcoded
 * fallback in src/lib/services/menu.ts) into find_menu_links, scoped to this site's domain_id.
 *
 * WHY THIS IS NEEDED: getMenu() (src/lib/services/menu.ts), which the live public Navbar
 * actually renders from, queries find_menu_links for active/logged_out rows that apply to this
 * domain and falls back to the hardcoded DEFAULT_MENU array whenever fewer than 3 such rows
 * exist. find_menu_links currently has 727 rows total, but they're from the old shared legacy
 * install's OTHER domains — essentially none of them apply to this site's domain_id, so the
 * live navbar has been running on the hardcoded fallback the entire time, and CP → Menu
 * Manager could only ever show unrelated legacy junk, never anything that actually controls
 * the header. This script closes that gap: once it runs, the real menu becomes rows in the
 * database, so (a) getMenu() reads the same content from find_menu_links instead of falling
 * back, and (b) CP → Menu Manager (now scoped to this domain — see menuLinksRepository.ts) shows
 * and can edit exactly what's on the live header, nothing else.
 *
 * Idempotent: safe to re-run — matches existing rows by (title, parent, this domain) and only
 * inserts what's missing, mirroring the same ensureX() pattern already used by
 * src/app/cp/_scripts/seed.ts and bootstrap-admin.ts.
 *
 * Run with:
 *   npx tsx seed-menu-links.ts
 */
import "dotenv/config"; // same recurring gotcha as every other standalone script in this
// project: plain `npx tsx` doesn't auto-load .env, so DATABASE_URL would be empty and
// src/lib/prisma.ts would silently fall back to its in-memory mock client without this.
import { prisma } from "@/lib/prisma";
import { DOMAIN_ID } from "@/lib/site-config";
import { DEFAULT_MENU, type MenuItem } from "@/lib/services/menu";

const DOMAIN_ID_STR = String(DOMAIN_ID);

async function ensureLink(input: {
  title: string;
  link: string;
  target: string;
  parentId: number | null;
  ordering: number;
}): Promise<number> {
  const existing = await prisma.find_menu_links.findFirst({
    where: { title: input.title, parent_id: input.parentId, domain_id: DOMAIN_ID_STR },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.find_menu_links.create({
    data: {
      title: input.title,
      link: input.link,
      target: input.target || "_self",
      parent_id: input.parentId,
      ordering: input.ordering,
      active: 1,
      logged_in: 1,
      logged_out: 1,
      nofollow: 0,
      sitemap: 1,
      sitemap_xml: 1,
      base_url: false,
      domain_id: DOMAIN_ID_STR,
    },
    select: { id: true },
  });
  console.log(`Created "${input.title}" -> ${input.link} (id=${created.id}${input.parentId ? `, parent=${input.parentId}` : ""})`);
  return created.id;
}

async function seedItem(item: MenuItem, ordering: number, parentId: number | null): Promise<void> {
  const id = await ensureLink({ title: item.title, link: item.link, target: item.target, parentId, ordering });
  let childOrder = 10;
  for (const child of item.children) {
    await seedItem(child, childOrder, id);
    childOrder += 10;
  }
}

async function main() {
  console.log(`Seeding ${DEFAULT_MENU.length} top-level menu items (+ children) for domain_id="${DOMAIN_ID_STR}"...\n`);
  let topOrder = 10;
  for (const item of DEFAULT_MENU) {
    await seedItem(item, topOrder, null);
    topOrder += 10;
  }
  console.log("\nDone. The live navbar and CP > Menu Manager now both read these rows.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
