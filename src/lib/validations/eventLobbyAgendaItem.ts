import { z } from "zod";

// Mirrors find_event_lobby_agenda_items — one scheduled session within a track.
export const AGENDA_ITEM_STATUSES = ["active", "inactive"] as const;
export const AGENDA_VIDEO_TYPES = ["", "zoom", "youtube", "vimeo", "other"] as const;

const optionalText = z.string().trim().optional().or(z.literal(""));

export const eventLobbyAgendaItemSchema = z
  .object({
    agenda_id: z.coerce.number().int().min(1, "Select a session track"),
    title: z.string().trim().min(1, "Title is required").max(255),
    description: z.string().trim().optional().or(z.literal("")),
    session_date: z.string().trim().min(1, "Session date is required"),
    start_time: z.string().trim().min(1, "Start time is required"),
    end_time: z.string().trim().min(1, "End time is required"),
    speaker_id: z.coerce.number().int().optional().nullable(),
    speaker_name: optionalText,
    video_type: z.enum(AGENDA_VIDEO_TYPES).default(""),
    meeting_id: optionalText,
    meeting_password: optionalText,
    video_link: optionalText,
    status: z.enum(AGENDA_ITEM_STATUSES).default("active"),
    tentative_schedule: z.boolean().default(false),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be after the start time",
    path: ["end_time"],
  });

export type EventLobbyAgendaItemInput = z.infer<typeof eventLobbyAgendaItemSchema>;
