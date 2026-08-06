import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventWelcomePackInput } from "@/lib/validations/eventWelcomePack";

export interface WelcomePackRow {
  id: number;
  title: string;
  businessName: string | null;
  url: string;
  thumbnailUrl: string | null;
}

const SELECT_FIELDS = { id: true, title: true, business_name: true, url: true, thumbnail_url: true } as const;

function toRow(w: any): WelcomePackRow {
  return { id: w.id, title: w.title ?? "", businessName: w.business_name, url: w.url ?? "", thumbnailUrl: w.thumbnail_url };
}

/** Resolves this event's primary lobby layout, mirroring event_welcome_pack.php's
 * `select id from find_event_lobby_layout_manager where event_id=?` lookup. */
async function resolveLayoutId(eventId: number): Promise<number | null> {
  const layout = await prisma.find_event_lobby_layout_manager.findFirst({
    where: { event_id: eventId },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  return layout?.id ?? null;
}

/** Mirrors members/event_welcome_pack.php's list — organiser-only brochures/documents attached to
 * this event's welcome pack (find_event_welcome_pack). File uploads (brochure PDFs + generated
 * thumbnails) are simplified to plain URL fields here — no upload/thumbnail-generation pipeline.
 * The legacy "sync brochures to every attendee's briefcase" action is also out of scope. */
export async function getWelcomePackItems(context: EventMemberContext): Promise<WelcomePackRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_event_welcome_pack.findMany({
    where: { event_id: context.eventId },
    orderBy: { id: "desc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function hasLobbyLayout(context: EventMemberContext): Promise<boolean> {
  return (await resolveLayoutId(context.eventId)) !== null;
}

export async function createWelcomePackItem(
  context: EventMemberContext,
  input: EventWelcomePackInput
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  if (context.role !== "organiser") return { ok: false, error: "Only the event organiser can manage the welcome pack." };

  const layoutId = await resolveLayoutId(context.eventId);
  if (!layoutId) {
    return { ok: false, error: "Set up an Event Lobby Layout for this event before adding welcome pack items." };
  }

  const created = await prisma.find_event_welcome_pack.create({
    data: {
      event_id: context.eventId,
      event_layout_id: layoutId,
      title: input.title,
      business_name: input.business_name || null,
      url: input.url,
      thumbnail_url: input.thumbnail_url || null,
    },
    select: { id: true },
  });

  return { ok: true, id: created.id };
}

export async function updateWelcomePackItem(context: EventMemberContext, id: number, input: EventWelcomePackInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_welcome_pack.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      title: input.title,
      business_name: input.business_name || null,
      url: input.url,
      thumbnail_url: input.thumbnail_url || null,
    },
  });
}

export async function deleteWelcomePackItem(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_welcome_pack.deleteMany({ where: { id, event_id: context.eventId } });
}
