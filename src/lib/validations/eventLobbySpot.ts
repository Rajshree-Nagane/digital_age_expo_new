import { z } from "zod";

/**
 * Simplified stand-in for the legacy spot_type catalogue (exhibitor, sponsor, video,
 * session_details, speaker_details, exhibitor_asset, speaker_asset, welcome_tour — each with
 * its own specialized sub-form tied to exhibitor/sponsor/agenda/asset subsystems that don't
 * exist in this app yet). These four generic types cover "a hotspot on the lobby image that
 * optionally links somewhere" without assuming those subsystems are wired up.
 */
export const LOBBY_SPOT_TYPES = ["info", "video", "link", "networking"] as const;

export const eventLobbySpotSchema = z.object({
  title: z.string().trim().max(120).optional().or(z.literal("")),
  spot_type: z.enum(LOBBY_SPOT_TYPES).default("info"),
  redirection_path: z.string().trim().max(255).optional().or(z.literal("")),
  x: z.coerce.number().min(0).max(100),
  y: z.coerce.number().min(0).max(100),
});

export type EventLobbySpotInput = z.infer<typeof eventLobbySpotSchema>;
