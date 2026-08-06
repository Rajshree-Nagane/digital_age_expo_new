import { z } from "zod";

export const exhibitorRegistrationSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  position: z.string().trim().min(1, "Position is required"),
  business: z.string().trim().min(1, "Business is required"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().min(1, "Mobile number is required"),
  work_phone: z.string().trim().optional(),
  exhibition_zone: z.string().trim().optional(),
  linkedin_user_profile: z.string().trim().optional(),
  referral_source: z.string().trim().optional(),
  referral_code: z.string().trim().optional(),
  keynote_interest: z.enum(["yes", "no", "maybe"]).optional(),
  is_webinars: z.boolean().optional(),
  is_workshops: z.boolean().optional(),
  is_business_presentation: z.boolean().optional(),
  is_e_magazine: z.boolean().optional(),
  is_newsletter: z.boolean().optional(),
  confirm_consent: z.boolean().refine((val) => val === true, {
    message: "You must confirm that you have read and understood the terms.",
  }),
});

export type ExhibitorRegistrationInput = z.infer<typeof exhibitorRegistrationSchema>;

