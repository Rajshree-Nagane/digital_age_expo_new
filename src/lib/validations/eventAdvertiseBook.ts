import { z } from "zod";

export const ADVERTISE_BOOK_STATUSES = ["active", "inactive"] as const;

export const eventAdvertiseBookSchema = z.object({
  book_id: z.union([z.number(), z.string()]).refine((v) => Number(v) > 0, "Please select a magazine template"),
  title: z.string().trim().optional().or(z.literal("")),
  publication_type: z.string().trim().optional().or(z.literal("")),
  publication_title_id: z.string().trim().optional().or(z.literal("")),
  issue_link: z.string().trim().optional().or(z.literal("")),
  status: z.enum(ADVERTISE_BOOK_STATUSES).default("active"),
});

export type EventAdvertiseBookInput = z.infer<typeof eventAdvertiseBookSchema>;
