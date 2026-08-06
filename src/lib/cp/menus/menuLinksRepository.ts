import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

/** Backs the general site Menu Manager module (find_menu_links) — top-level nav, footer links, etc. */
export async function listMenuLinks(params: { page?: number; search?: string } = {}) {
  const page = Math.max(1, params.page ?? 1);
  const search = params.search?.trim();

  const where = search
    ? { OR: [{ title: { contains: search } }, { link: { contains: search } }] }
    : {};

  const [links, total] = await Promise.all([
    prisma.find_menu_links.findMany({
      where,
      orderBy: [{ parent_id: "asc" }, { ordering: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.find_menu_links.count({ where }),
  ]);

  return { links, total, page, pageSize: PAGE_SIZE };
}

export async function getMenuLinkForEdit(id: number) {
  return prisma.find_menu_links.findUnique({ where: { id } });
}

export async function listTopLevelLinks() {
  return prisma.find_menu_links.findMany({
    where: { parent_id: null },
    orderBy: { ordering: "asc" },
    select: { id: true, title: true },
  });
}

export interface MenuLinkInput {
  title: string;
  link: string;
  parent_id: number | null;
  target: string;
  ordering: number;
  active: boolean;
  logged_in: boolean;
  logged_out: boolean;
  icon: string;
  color: string;
}

function toDb(input: MenuLinkInput) {
  return {
    title: input.title,
    link: input.link,
    parent_id: input.parent_id,
    target: input.target,
    ordering: input.ordering,
    active: input.active ? 1 : 0,
    logged_in: input.logged_in ? 1 : 0,
    logged_out: input.logged_out ? 1 : 0,
    icon: input.icon || null,
    color: input.color || null,
  };
}

export async function createMenuLink(input: MenuLinkInput): Promise<number> {
  const created = await prisma.find_menu_links.create({
    data: {
      ...toDb(input),
      nofollow: 0,
      sitemap: 1,
      sitemap_xml: 1,
      base_url: false,
    },
    select: { id: true },
  });
  return created.id;
}

export async function updateMenuLink(id: number, input: MenuLinkInput): Promise<void> {
  await prisma.find_menu_links.update({ where: { id }, data: toDb(input) });
}

export async function deleteMenuLink(id: number): Promise<void> {
  // Re-parent any children up to the deleted item's own parent, rather than orphaning them
  // under a parent_id that no longer exists.
  const link = await prisma.find_menu_links.findUnique({ where: { id }, select: { parent_id: true } });
  await prisma.find_menu_links.updateMany({ where: { parent_id: id }, data: { parent_id: link?.parent_id ?? null } });
  await prisma.find_menu_links.delete({ where: { id } });
}
