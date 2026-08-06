import { z } from "zod";

export const eventWelcomePackSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  business_name: z.string().trim().max(255).optional().or(z.literal("")),
  url: z.string().trim().min(1, "A document URL is required").max(500),
  thumbnail_url: z.string().trim().max(500).optional().or(z.literal("")),
});

export type EventWelcomePackInput = z.infer<typeof eventWelcomePackSchema>;
