import { z } from "zod";

export const securityDetailsSchema = z
  .object({
    first_name: z.string().trim().min(1, "First name is required"),
    last_name: z.string().trim().min(1, "Last name is required"),
    phone: z.string().trim().min(7, "Please enter a valid mobile number"),
    organization: z.string().trim().optional().or(z.literal("")),
    new_password: z.string().min(0).optional().or(z.literal("")),
    confirm_new_password: z.string().min(0).optional().or(z.literal("")),
  })
  .refine((data) => !data.new_password || data.new_password.length >= 8, {
    message: "Password must be at least 8 characters",
    path: ["new_password"],
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Passwords do not match",
    path: ["confirm_new_password"],
  });

export type SecurityDetailsInput = z.infer<typeof securityDetailsSchema>;
