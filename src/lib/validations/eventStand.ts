import { z } from "zod";

export const standProfileSchema = z.object({
  business: z.string().trim().min(1, "Business name is required"),
  website: z.string().trim().optional().or(z.literal("")),
  about_us: z.string().trim().optional().or(z.literal("")),
  keynote_speech_topic: z.string().trim().optional().or(z.literal("")),
  facebook: z.string().trim().optional().or(z.literal("")),
  twitter: z.string().trim().optional().or(z.literal("")),
  instagram: z.string().trim().optional().or(z.literal("")),
  whatsapp_no: z.string().trim().optional().or(z.literal("")),
  zoom: z.string().trim().optional().or(z.literal("")),
  calendly: z.string().trim().optional().or(z.literal("")),
  youtube: z.string().trim().optional().or(z.literal("")),
  logo: z.string().trim().optional().or(z.literal("")),
});
export type StandProfileInput = z.infer<typeof standProfileSchema>;

export const standSpotSchema = z.object({
  title: z.string().trim().optional().or(z.literal("")),
  help_text: z.string().trim().max(200).optional().or(z.literal("")),
  video_url: z.string().trim().max(100).optional().or(z.literal("")),
  is_video: z.boolean().default(false),
  chat_script: z.string().trim().max(200).optional().or(z.literal("")),
  meeting_id: z.string().trim().max(50).optional().or(z.literal("")),
  meeting_password: z.string().trim().max(50).optional().or(z.literal("")),
});
export type StandSpotInput = z.infer<typeof standSpotSchema>;
