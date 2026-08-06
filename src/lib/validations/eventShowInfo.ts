import { z } from "zod";

export const showInfoSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  is_publish: z.boolean().default(false),
});

export type ShowInfoInput = z.infer<typeof showInfoSchema>;
