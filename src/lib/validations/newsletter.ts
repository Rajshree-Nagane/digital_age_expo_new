import { z } from "zod";

export const newsletterSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email address"),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
