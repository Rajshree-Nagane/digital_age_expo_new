import { z } from "zod";

export const VISITOR_STATUSES = [
  "Pending",
  "Invited",
  "Registered",
  "Checked In",
  "Not Interested",
  "Unable to attend",
  "Call Back",
  "No Answer",
  "Invalid Number",
  "Voice Mail",
  "Meeting Scheduled",
  "Excluded",
  "Excluded_Email",
  "Excluded_Mobile",
] as const;

/** Mirrors view_visitor.php's bulk-action buttons — each just sets `status` to one of these
 * literals for the selected rows (the three "Excluded*" variants additionally copy the row into
 * find_event_excluded, see bulkSetVisitorStatus). */
export const VISITOR_BULK_STATUS_ACTIONS = [
  "Pending",
  "Invited",
  "Registered",
  "Checked In",
  "Not Interested",
  "Unable to attend",
  "Call Back",
  "No Answer",
  "Invalid Number",
  "Voice Mail",
  "Meeting Scheduled",
  "Excluded",
  "Excluded_Email",
  "Excluded_Mobile",
] as const;

export const eventVisitorSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional().or(z.literal("")),
  workphone: z.string().trim().optional().or(z.literal("")),
  gender: z.string().trim().optional().or(z.literal("")),
  business: z.string().trim().optional().or(z.literal("")),
  position: z.string().trim().optional().or(z.literal("")),
  linkedin_user_profile: z.string().trim().optional().or(z.literal("")),
  referral_code: z.string().trim().optional().or(z.literal("")),
  referral_mstr_id: z.string().trim().optional().or(z.literal("")),
  visitor_referrer_from: z.string().trim().optional().or(z.literal("")),
  visitor_why_exhibit: z.string().trim().optional().or(z.literal("")),
  visitor_is_webinars: z.boolean().optional().default(false),
  visitor_is_workshops: z.boolean().optional().default(false),
  visitor_is_e_magazine: z.boolean().optional().default(false),
  visitor_is_newsletter: z.boolean().optional().default(false),
  excluded_from_advertise: z.boolean().optional().default(false),
  award_guest: z.boolean().optional().default(false),
  allergy_from_nuts: z.boolean().optional().default(false),
  allergey_from_shell_fish: z.boolean().optional().default(false),
  allergey_from_dairy_products: z.boolean().optional().default(false),
  vegetarian: z.boolean().optional().default(false),
  vegan: z.boolean().optional().default(false),
  dietary_requirement: z.string().trim().optional().or(z.literal("")),
  any_other_food_allergy: z.string().trim().optional().or(z.literal("")),
  batch_number: z.string().trim().optional().or(z.literal("")),
  source: z.string().trim().optional().or(z.literal("")),
  status: z.enum(VISITOR_STATUSES).default("Pending"),
});

export type EventVisitorInput = z.infer<typeof eventVisitorSchema>;
