import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

/** Backs the Member Menu Manager module (find_event_menus) — the members dashboard's own nav, gated per member role. */
export async function listEventMenus(params: { page?: number; search?: string } = {}) {
  const page = Math.max(1, params.page ?? 1);
  const search = params.search?.trim();

  const where = search
    ? { OR: [{ title: { contains: search } }, { link: { contains: search } }] }
    : {};

  const [items, total] = await Promise.all([
    prisma.find_event_menus.findMany({
      where,
      orderBy: [{ menu_group: "asc" }, { sequence: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.find_event_menus.count({ where }),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE };
}

export async function getEventMenuForEdit(id: number) {
  return prisma.find_event_menus.findUnique({ where: { id } });
}

export interface EventMenuInput {
  title: string;
  link: string;
  menu_type: string;
  event_category: string;
  icon: string;
  /** find_event_menus.page_name has no DB default and is NOT NULL — must always be supplied. */
  page_name: string;
  color: string;
  sequence: number;
  visible: boolean;
  visitor: boolean;
  organiser: boolean;
  exhibitor: boolean;
  sponsor: boolean;
  speaker: boolean;
  partner: boolean;
  marketer: boolean;
  menu_group: string;
}

function toDb(input: EventMenuInput) {
  return {
    title: input.title,
    link: input.link,
    menu_type: input.menu_type,
    event_category: input.event_category,
    icon: input.icon,
    page_name: input.page_name,
    color: input.color || "primary",
    sequence: input.sequence,
    visible: input.visible,
    visitor: input.visitor,
    organiser: input.organiser,
    exhibitor: input.exhibitor,
    sponsor: input.sponsor,
    speaker: input.speaker,
    partner: input.partner ? 1 : 0,
    marketer: input.marketer ? 1 : 0,
    menu_group: input.menu_group || null,
  };
}

export async function createEventMenu(input: EventMenuInput): Promise<number> {
  const created = await prisma.find_event_menus.create({
    data: { ...toDb(input), is_modal: 0 },
    select: { id: true },
  });
  return created.id;
}

export async function updateEventMenu(id: number, input: EventMenuInput): Promise<void> {
  await prisma.find_event_menus.update({ where: { id }, data: toDb(input) });
}

export async function deleteEventMenu(id: number): Promise<void> {
  await prisma.find_event_menus.delete({ where: { id } });
}
