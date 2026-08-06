import { z } from "zod";

export const freeTicketSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  business: z.string().trim().optional(),
  position: z.string().trim().optional(),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().min(1, "Mobile number is required"),
  interest: z.string().trim().optional(),
});

export type FreeTicketInput = z.infer<typeof freeTicketSchema>;
