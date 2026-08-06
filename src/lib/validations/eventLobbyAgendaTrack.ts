import { z } from "zod";

// Mirrors find_event_lobby_agenda — the "hall/track" a session belongs to (e.g. Main Stage,
// Workshop Room). members/event_lobby_agenda_items.php lets the organiser create these inline
// while building the schedule, so this schema backs that same lightweight quick-add flow.
export const AGENDA_TRACK_STATUSES = ["active", "inactive"] as const;

const optionalText = z.string().trim().optional().or(z.literal(""));

export const eventLobbyAgendaTrackSchema = z.object({
  title: z.string().trim().min(1, "Track name is required").max(255),
  description: optionalText,
  agenda_type: optionalText,
  status: z.enum(AGENDA_TRACK_STATUSES).default("active"),
});

export type EventLobbyAgendaTrackInput = z.infer<typeof eventLobbyAgendaTrackSchema>;
