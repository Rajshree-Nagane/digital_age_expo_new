import { z } from "zod";

/** One speaking-slot request within a questionnaire submission. Mirrors the fields
 * captured by includes/blocks/speaker_questionaire.php (title, topic_description,
 * preferred_date, preferred_time, talk_duration, room/agenda selection). */
export const speakerQuestionaireSessionSchema = z.object({
  room_type: z.string().trim().optional().or(z.literal("")),
  agenda_id: z.string().trim().optional().or(z.literal("")),
  preferred_date: z.string().trim().min(1, "Preferred date is required"),
  preferred_time: z.string().trim().min(1, "Preferred time slot is required"),
  talk_duration: z.string().trim().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Session topic is required"),
  topic_description: z.string().trim().optional().or(z.literal("")),
});

export const speakerQuestionaireSchema = z.object({
  speaker_id: z.union([z.number(), z.string()]).optional(),
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().min(1, "Profile description is required"),
  sessions: z.array(speakerQuestionaireSessionSchema).min(1, "At least one speaking session is required"),
});

export type SpeakerQuestionaireInput = z.infer<typeof speakerQuestionaireSchema>;
export type SpeakerQuestionaireSessionInput = z.infer<typeof speakerQuestionaireSessionSchema>;
