import { z } from "zod";

export const LOBBY_STATUSES = ["enabled", "disabled"] as const;

const optionalText = z.string().trim().optional().or(z.literal(""));

export const eventLobbySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  splash_image: optionalText,
  image: optionalText,
  video_path: optionalText,
  play_lobby_video: z.boolean().default(false),
  description: z.string().trim().max(300, "Keep it under 300 characters").optional().or(z.literal("")),
  agenda_welcome_message: z.string().trim().max(300, "Keep it under 300 characters").optional().or(z.literal("")),
  status: z.enum(LOBBY_STATUSES).default("enabled"),
  chat_script: optionalText,
  spot_color: optionalText,
  spot_size: z.coerce.number().int().min(1).max(100).default(5),
});

export type EventLobbyInput = z.infer<typeof eventLobbySchema>;
