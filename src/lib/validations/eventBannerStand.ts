import { z } from "zod";

export const BANNER_STAND_STATUSES = ["active", "pending", "reject"] as const;

export const eventBannerStandSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  first_name: z.string().trim().optional().or(z.literal("")),
  last_name: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  work_phone: z.string().trim().optional().or(z.literal("")),
  position: z.string().trim().optional().or(z.literal("")),
  title: z.string().trim().optional().or(z.literal("")), // Banner Stand Title / Topic
  description: z.string().trim().optional().or(z.literal("")),
  speaker_hall: z.string().trim().optional().or(z.literal("")),
  linkedin_user_profile: z.string().trim().optional().or(z.literal("")),
  date: z.string().trim().optional().or(z.literal("")),
  exhibitor_user_id: z.string().trim().optional().or(z.literal("")),
  listing_id: z.number().nullable().optional(),
  order_id: z.number().nullable().optional(),
  stand_id: z.number().nullable().optional(),
  stand_price: z.number().nonnegative().optional().default(0),
  discount: z.number().nonnegative().optional().default(0),
  charitable_amount: z.number().nonnegative().optional().default(0),
  exchange_services: z.boolean().default(false),
  exchange_amount: z.number().nonnegative().optional().default(0),
  status: z.enum(BANNER_STAND_STATUSES).default("active"),
});

export type EventBannerStandInput = z.infer<typeof eventBannerStandSchema>;
