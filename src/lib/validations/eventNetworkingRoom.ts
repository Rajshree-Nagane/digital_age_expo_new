import { z } from "zod";

export const NETWORKING_ROOM_TYPES = ["daily", "link"] as const;

const optionalText = z.string().trim().max(500).optional().or(z.literal(""));
const optionalDate = z.string().trim().optional().or(z.literal(""));

export const eventNetworkingRoomSchema = z.object({
  room_name: z.string().trim().min(1, "Room name is required").max(255),
  room_type: z.enum(NETWORKING_ROOM_TYPES).default("link"),
  room_url: optionalText,
  register_url: optionalText,
  max_participants: z.coerce.number().int().min(1, "Must be at least 1").max(100000),
  room_date: optionalDate,
  start_time: optionalDate,
  end_time: optionalDate,
});

export type EventNetworkingRoomInput = z.infer<typeof eventNetworkingRoomSchema>;
