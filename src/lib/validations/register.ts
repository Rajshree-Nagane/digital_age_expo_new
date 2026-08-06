import { z } from "zod";

export const registerSchema = z
  .object({
    login: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, _ . -"),
    first_name: z.string().trim().min(1, "First name is required"),
    last_name: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("Please enter a valid email address"),
    phone: z.string().trim().min(7, "Please enter a valid mobile number"),
    organization: z.string().trim().optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    terms_accepted: z.boolean().refine((value) => value === true, {
      message: "You must accept the terms to register",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
