import { z } from "zod";

export const SPONSOR_STATUSES = ["pending", "active", "approved", "unapproved", "excluded"] as const;

export const eventSponsorAdminSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  business: z.string().trim().optional().or(z.literal("")),
  position: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().optional().or(z.literal("")),
  linkedin_user_profile: z.string().trim().optional().or(z.literal("")),
  sponsor_type: z.string().trim().optional().or(z.literal("")),
  status: z.enum(SPONSOR_STATUSES).default("pending"),
  is_approved: z.boolean().default(false),
  enable_home_page: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export type EventSponsorAdminInput = z.infer<typeof eventSponsorAdminSchema>;
