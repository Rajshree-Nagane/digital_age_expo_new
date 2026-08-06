import { z } from "zod";

export const ADVERTISER_STATUSES = ["pending", "active", "inactive", "suspended", "excluded"] as const;

export const eventAdvertiserSchema = z.object({
  first_name: z.string().trim().optional().or(z.literal("")),
  last_name: z.string().trim().optional().or(z.literal("")),
  business: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  work_phone: z.string().trim().optional().or(z.literal("")),
  position: z.string().trim().optional().or(z.literal("")),
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
  status: z.enum(ADVERTISER_STATUSES).default("pending"),
  advert_size: z.string().trim().optional().or(z.literal("")),
  advert_size_price: z.number().nonnegative().optional().default(0),
  discount: z.number().nonnegative().optional().default(0),
  charitable_amount: z.number().nonnegative().optional().default(0),
  listing_id: z.number().nullable().optional(),
  order_id: z.number().nullable().optional(),
  flag: z.boolean().optional().default(false),
  fb: z.string().trim().optional().or(z.literal("")),
  twitter: z.string().trim().optional().or(z.literal("")),
  linkedin: z.string().trim().optional().or(z.literal("")),
});

export type EventAdvertiserInput = z.infer<typeof eventAdvertiserSchema>;
