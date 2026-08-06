import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

export const eventDetailsSchema = z.object({
  // Core
  title: z.string().trim().min(1, "Title is required"),
  date_start: z.string().min(1, "Start date is required"),
  date_end: z.string().optional().or(z.literal("")),
  venue: optionalText,
  location: optionalText,
  website: optionalText,
  email: z.string().trim().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: optionalText,
  contact_name: optionalText,
  contact_address: optionalText,

  // Descriptions
  description_short: optionalText,
  description: optionalText,
  category_description: optionalText,

  // SEO & social
  friendly_url: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers, and hyphens only")
    .optional()
    .or(z.literal("")),
  meta_title: optionalText,
  meta_keywords: optionalText,
  meta_description: optionalText,
  keywords: optionalText,
  facebook_url: optionalText,
  facebook_group_url: optionalText,
  twitter_url: optionalText,
  linkedin_url: optionalText,
  linkedin_group_url: optionalText,
  instagram_url: optionalText,
  youtube_channel_url: optionalText,
  zoom_url: optionalText,

  // Visibility toggles
  hide_home: z.boolean().default(false),
  hide_exhibitor: z.boolean().default(false),
  hide_sponsor: z.boolean().default(false),
  hide_speaker: z.boolean().default(false),
  hide_visitor: z.boolean().default(false),
  hide_speaker_home: z.boolean().default(false),
  hide_eventimage: z.boolean().default(false),
  hide_eventvideo: z.boolean().default(false),

  // Expected stats shown on marketing pages
  expected_no_of_exhibitor: z.coerce.number().int().optional(),
  expected_no_of_exhibitor_display_text: optionalText,
  expected_no_of_investor: z.coerce.number().int().optional(),
  expected_no_of_investor_display_text: optionalText,
  expected_no_of_workshop_panel: z.coerce.number().int().optional(),
  expected_no_of_workshop_panel_display_text: optionalText,
  expected_no_of_countries: z.coerce.number().int().optional(),
  expected_no_of_countries_display_text: optionalText,
});

export type EventDetailsInput = z.infer<typeof eventDetailsSchema>;
