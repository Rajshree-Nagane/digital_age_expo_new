import { z } from "zod";

const optionalNumberText = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  });

export const eventTicketSchema = z.object({
  name: z.string().trim().min(1, "Title is required"),
  sub_title: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  additional_info: z.string().trim().optional().or(z.literal("")),
  amount: optionalNumberText,
  apply_early_bird: z.boolean().default(false),
  early_bird_discount: optionalNumberText,
  group_ticket_price: optionalNumberText,
  max_attendees_allow: optionalNumberText,
  sequence: optionalNumberText,
  active: z.boolean().default(true),
  featured_ticket: z.boolean().default(false),
  sold_out_ticket: z.boolean().default(false),
});

export type EventTicketInput = z.input<typeof eventTicketSchema>;
