import { z } from "zod";

export const PROMOTION_STATUSES = ["active", "pending", "inactive"] as const;

export const eventPromotionSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional().or(z.literal("")),
  first_name: z.string().trim().optional().or(z.literal("")),
  last_name: z.string().trim().optional().or(z.literal("")),
  business: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  position: z.string().trim().optional().or(z.literal("")),
  advert_size: z.string().trim().optional().or(z.literal("")),
  publication_category: z.string().trim().optional().or(z.literal("")),
  image: z.string().trim().optional().or(z.literal("")),
  status: z.enum(PROMOTION_STATUSES).default("pending"),
});

export type EventPromotionInput = z.infer<typeof eventPromotionSchema>;
