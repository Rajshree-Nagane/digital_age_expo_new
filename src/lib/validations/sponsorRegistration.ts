import { z } from "zod";

export const sponsorRegistrationSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  position: z.string().trim().min(1, "Job title is required"),
  business: z.string().trim().min(1, "Company name is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  work_phone: z.string().trim().optional(),
  email: z.string().trim().email("Please enter a valid email address"),
  linkedin_user_profile: z.string().trim().optional(),
  referral_source: z.string().trim().optional(),
  referral_code: z.string().trim().optional(),
  why_exhibit: z.string().trim().optional(),
  is_webinars: z.boolean().optional(),
  is_workshops: z.boolean().optional(),
  is_e_magazine: z.boolean().optional(),
  is_newsletter: z.boolean().optional(),
  is_business_presentation: z.boolean().optional(),
  confirm_consent: z.boolean().refine((val) => val === true, {
    message: "You must confirm that you have read and understood this.",
  }),
  sponsorship_tier_id: z.string().trim().optional().or(z.literal("")),
});

export type SponsorRegistrationInput = z.infer<typeof sponsorRegistrationSchema>;

