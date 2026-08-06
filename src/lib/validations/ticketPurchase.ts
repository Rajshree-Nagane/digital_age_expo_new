import { z } from "zod";

export const ticketPurchaseSchema = z.object({
  ticket_id: z.number().int().positive("Please select a ticket"),
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().optional(),
  business: z.string().trim().optional(),
});

export type TicketPurchaseInput = z.infer<typeof ticketPurchaseSchema>;
