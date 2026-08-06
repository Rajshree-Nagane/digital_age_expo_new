import { z } from "zod";

export const QUESTIONNAIRE_STATUSES = ["active", "pending", "reject"] as const;

export const eventSpeakerQuestionnaireSchema = z.object({
  first_name: z.string().trim().optional().or(z.literal("")),
  last_name: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Speaker name is required"),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  work_phone: z.string().trim().optional().or(z.literal("")),
  title: z.string().trim().optional().or(z.literal("")), // Presentation Topic
  description: z.string().trim().optional().or(z.literal("")), // Profile Description
  topic_description: z.string().trim().optional().or(z.literal("")),
  talk_duration: z.string().trim().optional().or(z.literal("")), // 30mins, 1hour, 2hour, 3hour, 4hour
  preferred_date: z.string().trim().optional().or(z.literal("")),
  preferred_time: z.string().trim().optional().or(z.literal("")),
  
  // Workshop details
  conduct_workshop: z.boolean().default(false),
  workshop_topic: z.string().trim().optional().or(z.literal("")),
  workshop_duration: z.string().trim().optional().or(z.literal("")),
  workshop_preferred_date: z.string().trim().optional().or(z.literal("")),
  workshop_preferred_time: z.string().trim().optional().or(z.literal("")),
  workshop_description: z.string().trim().optional().or(z.literal("")),

  // Category Checkboxes
  is_business_speaker: z.boolean().default(true),
  is_keynote_speaker: z.boolean().default(false),
  is_webinar_speaker: z.boolean().default(false),
  is_seminar_speaker: z.boolean().default(false),
  is_live_worksop_speaker: z.boolean().default(false),
  is_vip_session_speaker: z.boolean().default(false),

  // Other Fields
  speaker_group: z.string().trim().optional().or(z.literal("")),
  speaker_keyword: z.string().trim().optional().or(z.literal("")),
  status: z.enum(QUESTIONNAIRE_STATUSES).default("active"),
});

export type EventSpeakerQuestionnaireInput = z.infer<typeof eventSpeakerQuestionnaireSchema>;
