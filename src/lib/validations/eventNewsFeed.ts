import { z } from "zod";

const optionalUrl = z.string().trim().max(500).optional().or(z.literal(""));
const optionalDate = z.string().trim().optional().or(z.literal(""));

export const eventNewsFeedSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(2000),
  url: optionalUrl,
  image: optionalUrl,
  limit: z.coerce.number().int().min(0).max(100).default(5),
  active: z.boolean().default(true),
  issue_date: optionalDate,
  expiry_date: optionalDate,
});

export type EventNewsFeedInput = z.infer<typeof eventNewsFeedSchema>;
