import { z } from "zod";

export const contactEnquirySchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Please enter a valid email address"),
  contact: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required"),
});

export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;
