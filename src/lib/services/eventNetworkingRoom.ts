import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventNetworkingRoomInput } from "@/lib/validations/eventNetworkingRoom";

export interface NetworkingRoomRow {
  id: number;
  roomName: string;
  roomType: string;
  maxParticipants: number;
  roomUrl: string | null;
  registerUrl: string | null;
  roomDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
}

const SELECT_FIELDS = {
  id: true,
  room_name: true,
  room_type: true,
  max_participants: true,
  room_url: true,
  register_url: true,
  room_date: true,
  start_time: true,
  end_time: true,
} as const;

function toRow(r: any): NetworkingRoomRow {
  return {
    id: r.id,
    roomName: r.room_name ?? "",
    roomType: r.room_type ?? "link",
    maxParticipants: r.max_participants ?? 0,
    roomUrl: r.room_url,
    registerUrl: r.register_url,
    roomDate: r.room_date,
    startTime: r.start_time,
    endTime: r.end_time,
  };
}

/** Mirrors members/event_networking_room.php — organiser-only virtual networking rooms for this
 * event (find_event_networking_rooms). The legacy page also calls the Daily.co video API to
 * auto-provision a room when room_type is "daily" — that third-party call is out of scope here,
 * so "daily" rooms just store whatever room_url the organiser enters, same as "link" rooms. */
export async function getNetworkingRooms(context: EventMemberContext): Promise<NetworkingRoomRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_event_networking_rooms.findMany({
    where: { event_id: context.eventId },
    orderBy: { id: "desc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function createNetworkingRoom(context: EventMemberContext, input: EventNetworkingRoomInput) {
  if (context.role !== "organiser") return null;
  return prisma.find_event_networking_rooms.create({
    data: {
      event_id: context.eventId,
      room_name: input.room_name,
      room_type: input.room_type,
      max_participants: input.max_participants,
      room_url: input.room_url || null,
      register_url: input.register_url || null,
      room_date: input.room_date ? new Date(input.room_date) : null,
      start_time: input.start_time ? new Date(input.start_time) : null,
      end_time: input.end_time ? new Date(input.end_time) : null,
    },
    select: { id: true },
  });
}

export async function updateNetworkingRoom(context: EventMemberContext, id: number, input: EventNetworkingRoomInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_networking_rooms.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      room_name: input.room_name,
      room_type: input.room_type,
      max_participants: input.max_participants,
      room_url: input.room_url || null,
      register_url: input.register_url || null,
      room_date: input.room_date ? new Date(input.room_date) : null,
      start_time: input.start_time ? new Date(input.start_time) : null,
      end_time: input.end_time ? new Date(input.end_time) : null,
    },
  });
}

export async function deleteNetworkingRoom(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_networking_rooms.deleteMany({ where: { id, event_id: context.eventId } });
}
