import { z } from "zod";

export const eventLobbyVisitorEnquirySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  email: z.string().email("Invalid email address").max(255, "Email must be at most 255 characters"),
  mobile_no: z.string().min(1, "Mobile number is required").max(100, "Mobile number must be at most 100 characters"),
  question_description: z.string().min(1, "Question is required").max(1000, "Question must be at most 1000 characters"),
  answer: z.string().max(255, "Answer must be at most 255 characters"),
});

export type EventLobbyVisitorEnquiryInput = z.infer<typeof eventLobbyVisitorEnquirySchema>;
