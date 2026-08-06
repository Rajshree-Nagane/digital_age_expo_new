import { z } from "zod";

// Mirrors members/view_industry_list.php's Industry_form — the legacy form adds no validators
// at all (every field is a plain text input with none of the usual addValidator calls), so only
// the name is required here for basic sanity; code/description stay fully optional.
export const industrySchema = z.object({
  mstr_nm: z.string().trim().min(1, "Name is required").max(400),
  mstr_cd: z.string().trim().max(255).optional().or(z.literal("")),
  service: z.string().trim().max(255).optional().or(z.literal("")),
  mstr_desc: z.string().trim().optional().or(z.literal("")),
});
export type IndustryInput = z.infer<typeof industrySchema>;
