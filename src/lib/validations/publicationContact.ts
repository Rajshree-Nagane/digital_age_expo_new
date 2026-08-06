import { z } from "zod";

export const publicationContactSchema = z.object({
  type: z.string().trim().min(1, "Type is required"),
  name: z.string().trim().min(1, "Contact name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  telephone: z.string().trim().min(1, "Telephone is required"),
  linkedin_user_profile: z.string().trim().optional().or(z.literal("")),
});

export type PublicationContactInput = z.infer<typeof publicationContactSchema>;
