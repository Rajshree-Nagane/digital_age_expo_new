import { z } from "zod";

export const exhibitorStatusSchema = z.object({
  status: z.enum(["active", "pending", "excluded"]),
});
export type ExhibitorStatusInput = z.infer<typeof exhibitorStatusSchema>;

export const speakerStatusSchema = z.object({
  status: z.enum(["active", "pending", "reject"]),
});
export type SpeakerStatusInput = z.infer<typeof speakerStatusSchema>;

export const sponsorStatusSchema = z.object({
  status: z.enum(["approved", "pending", "unapproved"]),
});
export type SponsorStatusInput = z.infer<typeof sponsorStatusSchema>;

export const visitorStatusSchema = z.object({
  status: z.enum(["Registered", "Pending", "Excluded"]),
});
export type VisitorStatusInput = z.infer<typeof visitorStatusSchema>;
