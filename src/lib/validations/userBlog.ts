import { z } from "zod";

export const BLOG_STATUSES = ["active", "pending", "suspended"] as const;

export const userBlogSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  content_short: z.string().trim().max(1000).optional().or(z.literal("")),
  content: z.string().trim().min(1, "Content is required"),
  status: z.enum(BLOG_STATUSES).default("active"),
  date_publish: z.string().trim().optional().or(z.literal("")),
});

export type UserBlogInput = z.infer<typeof userBlogSchema>;
