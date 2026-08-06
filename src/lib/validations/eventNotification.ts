import { z } from "zod";

const optionalId = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  });

export const eventNotificationSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  message: z.string().trim().min(1, "Message is required").max(255),
  layout: optionalId,
  exhibitor: optionalId,
});

export type EventNotificationInput = z.infer<typeof eventNotificationSchema>;
