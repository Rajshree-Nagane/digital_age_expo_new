import { z } from "zod";

export const eventTeamMemberSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional().or(z.literal("")),
  work_phone: z.string().trim().min(1, "Mobile number is required"),
  position: z.string().trim().min(1, "Position is required"),
  status: z.enum(["Pending", "Registered"]).default("Pending"),
  linkedin_user_profile: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  is_contact: z.boolean().default(false),
  enable_chat: z.boolean().default(false),
});

export type EventTeamMemberInput = z.infer<typeof eventTeamMemberSchema>;
