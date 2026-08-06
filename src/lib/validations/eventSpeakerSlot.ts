import { z } from "zod";

export const assignSpeakerSlotSchema = z.object({
  speaker_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  title: z.string().trim().min(1, "Topic is required"),
  topic_description: z.string().trim().optional().or(z.literal("")),
});

export type AssignSpeakerSlotInput = z.input<typeof assignSpeakerSlotSchema>;
