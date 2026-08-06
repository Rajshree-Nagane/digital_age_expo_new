import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventLobbySpotInput } from "@/lib/validations/eventLobbySpot";

export interface LobbySpotRow {
  id: number;
  title: string;
  spotType: string;
  redirectionPath: string | null;
  x: number;
  y: number;
}

const SELECT_FIELDS = {
  id: true,
  title: true,
  spot_type: true,
  post_action_path: true,
  x_coordinates: true,
  y_coordinates: true,
} as const;

function toRow(s: any): LobbySpotRow {
  return {
    id: s.id,
    title: s.title ?? "",
    spotType: s.spot_type ?? "info",
    redirectionPath: s.post_action_path,
    x: Number(s.x_coordinates ?? 0),
    y: Number(s.y_coordinates ?? 0),
  };
}

interface LobbyScope {
  eventLayoutId: number;
  childId?: number | null;
}

function scopeWhere(context: EventMemberContext, scope: LobbyScope) {
  return {
    event_id: context.eventId,
    event_layout_id: scope.eventLayoutId,
    event_layout_child_id: scope.childId ?? null,
  };
}

/**
 * Mirrors members/event_lobby_spots.php's spot listing — a simplified generic hotspot
 * placer over the lobby background image (see eventLobbySpot.ts validation for what's
 * intentionally not ported from the legacy multi-type drag/drop builder).
 */
export async function getSpots(context: EventMemberContext, scope: LobbyScope): Promise<LobbySpotRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_event_lobby_spots.findMany({
    where: scopeWhere(context, scope),
    orderBy: { id: "asc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function createSpot(context: EventMemberContext, scope: LobbyScope, input: EventLobbySpotInput) {
  if (context.role !== "organiser") return null;
  return prisma.find_event_lobby_spots.create({
    data: {
      event_id: context.eventId,
      event_layout_id: scope.eventLayoutId,
      event_layout_child_id: scope.childId ?? null,
      user_id: context.userId,
      title: input.title || null,
      spot_type: input.spot_type,
      post_action_type: input.redirection_path ? "external_link" : null,
      post_action_path: input.redirection_path || null,
      x_coordinates: String(input.x),
      y_coordinates: String(input.y),
      updated_on: new Date(),
    },
    select: { id: true },
  });
}

export async function updateSpot(context: EventMemberContext, id: number, input: Partial<EventLobbySpotInput>) {
  if (context.role !== "organiser") return { count: 0 };
  const data: Record<string, unknown> = { updated_on: new Date() };
  if (input.title !== undefined) data.title = input.title || null;
  if (input.spot_type !== undefined) data.spot_type = input.spot_type;
  if (input.redirection_path !== undefined) {
    data.post_action_path = input.redirection_path || null;
    data.post_action_type = input.redirection_path ? "external_link" : null;
  }
  if (input.x !== undefined) data.x_coordinates = String(input.x);
  if (input.y !== undefined) data.y_coordinates = String(input.y);

  return prisma.find_event_lobby_spots.updateMany({
    where: { id, event_id: context.eventId },
    data,
  });
}

export async function deleteSpot(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_lobby_spots.deleteMany({ where: { id, event_id: context.eventId } });
}
