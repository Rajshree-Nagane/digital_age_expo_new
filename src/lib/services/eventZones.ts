import { prisma } from "@/lib/prisma";
import { assetUrl } from "@/lib/assets";

export interface EventZoneItem {
  id: number;
  title: string;
  description: string | null;
  image: string | undefined;
}

/**
 * Mirrors includes/blocks/block_event_zones.tpl (Event_zones_Block): every
 * find_event_lobby_child_layout_manager row with layout_type='exhibition' that belongs to one of
 * this event's find_event_lobby_layout_manager rows. Powers the public "Event Zones" flip-card
 * grid on /event_zones (and is reused for the homepage teaser section).
 */
export async function getEventZones(eventId: number): Promise<EventZoneItem[]> {
  const layouts = await prisma.find_event_lobby_layout_manager.findMany({
    where: { event_id: eventId, status: "enabled" },
    select: { id: true },
  });
  if (layouts.length === 0) return [];

  const rows = await prisma.find_event_lobby_child_layout_manager.findMany({
    where: {
      event_id: eventId,
      layout_type: "exhibition",
      event_layout_id: { in: layouts.map((l: { id: number }) => l.id) },
      status: { not: "disabled" },
    },
    orderBy: [{ sequence: "asc" }, { id: "asc" }],
    select: { id: true, title: true, description: true, image: true },
  });

  return rows
    .filter((r: { title: string | null }) => (r.title ?? "").trim().length > 0)
    .map((r: { id: number; title: string | null; description: string | null; image: string | null }) => ({
      id: r.id,
      title: r.title ?? "Zone",
      description: r.description,
      image: assetUrl(r.image ? `files/lobby/child/${r.image}` : null),
    }));
}
