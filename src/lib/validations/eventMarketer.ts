import { z } from "zod";

export const MARKETER_STATUSES = ["pending", "active", "inactive", "suspended", "excluded"] as const;

export const eventMarketerSchema = z.object({
  first_name: z.string().trim().optional().or(z.literal("")),
  last_name: z.string().trim().optional().or(z.literal("")),
  business: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  title: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  image: z.string().trim().optional().or(z.literal("")),
  publication_category: z.string().trim().optional().or(z.literal("")),
  exchange_services: z.boolean().optional(),
  exchange_amount: z.string().trim().optional().or(z.literal("")),
  show_advertiser_on_speaker: z.boolean().optional(),
  show_advertiser_on_visitor: z.boolean().optional(),
  show_advertiser_on_sponsor: z.boolean().optional(),
  show_advertiser_on_upcoming_event: z.boolean().optional(),
  status: z.enum(MARKETER_STATUSES).default("pending"),
});

export type EventMarketerInput = z.infer<typeof eventMarketerSchema>;
