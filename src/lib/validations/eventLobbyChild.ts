import { z } from "zod";

export const CHILD_LOBBY_STATUSES = ["enabled", "disabled"] as const;

export const CHILD_LOBBY_LAYOUT_TYPES = [
  { value: "", label: "None" },
  { value: "networking", label: "Networking" },
  { value: "exhibition", label: "Exhibition" },
  { value: "exhibition_stand", label: "Exhibition Stand" },
  { value: "ballroom", label: "Ballroom" },
  { value: "auditorium", label: "Auditorium" },
  { value: "photobooth", label: "Photo Booth" },
] as const;

const optionalText = z.string().trim().optional().or(z.literal(""));

export const eventLobbyChildSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  layout_type: z
    .enum(["", "networking", "exhibition", "exhibition_stand", "ballroom", "auditorium", "photobooth"])
    .default(""),
  image: optionalText,
  help_image: optionalText,
  description: z.string().trim().max(300, "Keep it under 300 characters").optional().or(z.literal("")),
  sequence: z.coerce.number().int().optional().nullable(),
  status: z.enum(CHILD_LOBBY_STATUSES).default("enabled"),
});

export type EventLobbyChildInput = z.infer<typeof eventLobbyChildSchema>;
