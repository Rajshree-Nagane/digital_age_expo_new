import { z } from "zod";

/** Backs the "Copy Event" modal (mirrors members/user_events.php's copy-form fieldset:
 * copy_title, copy_friendly_url, copy_image, copy_date_start, copy_date_end). */
export const eventCopySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  friendly_url: z
    .string()
    .trim()
    .min(1, "Friendly URL is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  date_start: z.string().min(1, "Start date is required"),
  date_end: z.string().min(1, "End date is required"),
});

export type EventCopyInput = z.infer<typeof eventCopySchema>;
