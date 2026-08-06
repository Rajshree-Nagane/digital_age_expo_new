import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { ShowInfoInput } from "@/lib/validations/eventShowInfo";

export interface ShowInfo {
  id: number | null;
  description: string;
  isPublish: boolean;
}

/**
 * Mirrors members/event_show_info.php. The organiser always sees (and can edit) the raw
 * row regardless of publish state; every other role only sees it once Ispublish=1.
 */
export async function getShowInfo(context: EventMemberContext): Promise<ShowInfo | null> {
  const row = await prisma.find_show_info.findFirst({
    where: { event_id: context.eventId },
    select: { id: true, description: true, Ispublish: true },
  });

  if (context.role === "organiser") {
    return row
      ? { id: row.id, description: row.description, isPublish: row.Ispublish === 1 }
      : { id: null, description: "", isPublish: false };
  }

  if (!row || row.Ispublish !== 1) return null;
  return { id: row.id, description: row.description, isPublish: true };
}

/** Mirrors event_show_info.php's organiser-only add/edit branch — one row per event. */
export async function upsertShowInfo(context: EventMemberContext, input: ShowInfoInput): Promise<ShowInfo | null> {
  if (context.role !== "organiser") return null;

  const existing = await prisma.find_show_info.findFirst({
    where: { event_id: context.eventId },
    select: { id: true },
  });

  const row = existing
    ? await prisma.find_show_info.update({
        where: { id: existing.id },
        data: { description: input.description, Ispublish: input.is_publish ? 1 : 0 },
        select: { id: true, description: true, Ispublish: true },
      })
    : await prisma.find_show_info.create({
        data: {
          event_id: context.eventId,
          user_id: context.userId,
          description: input.description,
          Ispublish: input.is_publish ? 1 : 0,
        },
        select: { id: true, description: true, Ispublish: true },
      });

  return { id: row.id, description: row.description, isPublish: row.Ispublish === 1 };
}
