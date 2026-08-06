import { z } from "zod";

export const SPEAKER_STATUSES = ["pending", "active", "reject"] as const;

export const eventSpeakerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  work_phone: z.string().trim().optional().or(z.literal("")),
  position: z.string().trim().optional().or(z.literal("")),
  business: z.string().trim().optional().or(z.literal("")),
  exhibitor_user_id: z.string().trim().optional().or(z.literal("")),
  
  // Topic and Description
  title: z.string().trim().min(1, "Topic is required"),
  topic_description: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  speaker_hall: z.string().trim().optional().or(z.literal("")),
  speaker_type_price: z.number().or(z.string()).optional().transform((val) => (val ? Number(val) : 0)),

  // Social Links
  linkedin_user_profile: z.string().trim().optional().or(z.literal("")),
  facebook_url: z.string().trim().optional().or(z.literal("")),
  twitter_url: z.string().trim().optional().or(z.literal("")),
  instagram_url: z.string().trim().optional().or(z.literal("")),
  whatsapp_no: z.string().trim().optional().or(z.literal("")),
  zoom_url: z.string().trim().optional().or(z.literal("")),
  calendy_url: z.string().trim().optional().or(z.literal("")),
  youtube_url: z.string().trim().optional().or(z.literal("")),
  past_event_youtube_urls: z.string().trim().optional().or(z.literal("")),

  // Video and Session
  video_type: z.string().trim().optional().or(z.literal("")),
  meeting_id: z.string().trim().optional().or(z.literal("")),
  meeting_password: z.string().trim().optional().or(z.literal("")),
  video_link: z.string().trim().optional().or(z.literal("")),
  agenda_id: z.number().or(z.string()).optional().transform((val) => (val ? Number(val) : null)),
  date: z.string().trim().optional().or(z.literal("")),
  start_time: z.string().trim().optional().or(z.literal("")),
  end_time: z.string().trim().optional().or(z.literal("")),

  // Financials & Organiser options
  exchange_services: z.boolean().default(false),
  exchange_amount: z.number().or(z.string()).optional().transform((val) => (val ? Number(val) : 0)),
  discount: z.number().or(z.string()).optional().transform((val) => (val ? Number(val) : 0)),
  charitable_amount: z.number().or(z.string()).optional().transform((val) => (val ? Number(val) : 0)),

  // Category Checkboxes
  key_note_flag: z.boolean().default(false),
  is_business_speaker: z.boolean().default(true),
  is_masterclass_speaker: z.boolean().default(false),
  is_keynote_speaker: z.boolean().default(false),
  is_webinar_speaker: z.boolean().default(false),
  is_seminar_speaker: z.boolean().default(true),
  is_live_workshop_speaker: z.boolean().default(false),
  is_vip_session_speaker: z.boolean().default(false),

  // Other Flags & Fields
  excluded_from_advertise: z.boolean().default(false),
  hide_home: z.boolean().default(false),
  speaker_group: z.string().trim().optional().or(z.literal("")),
  speaker_keyword: z.string().trim().optional().or(z.literal("")),
  why_exhibit: z.string().trim().optional().or(z.literal("")),
  referral_code: z.string().trim().optional().or(z.literal("")),
  status: z.enum(SPEAKER_STATUSES).default("pending"),
});

export type EventSpeakerInput = z.infer<typeof eventSpeakerSchema>;

export const changeAmountSchema = z.object({
  speaker_id: z.number(),
  discount: z.number().min(0, "Discount cannot be negative"),
  charitable_amount: z.number().min(0, "Charitable amount cannot be negative"),
  exchange_amount: z.number().min(0, "Exchange amount cannot be negative"),
});

export type ChangeAmountInput = z.infer<typeof changeAmountSchema>;

