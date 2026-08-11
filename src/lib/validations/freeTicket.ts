import { z } from "zod";

/**
 * Mirrors template/findusonweb/blocks/visitor_register_form.php's referral dropdown, which the
 * legacy PHP builds from Common::getMstrDataAssociateByTypCD('FR') against the legacy
 * master-data table. That table isn't wired into this app, so this is a fixed stand-in list —
 * it covers the two codes the legacy PHP checks explicitly (FRFB for a Facebook-sourced visit,
 * FROSM for a LinkedIn-sourced visit) plus FROT ("Other"), which reveals the free-text
 * `referrer_from` field below it exactly like the legacy jQuery `#referral_mstr_id.change()`
 * handler did.
 */
export const REFERRAL_SOURCE_OPTIONS = [
  { code: "FRWEB", label: "Google / Web Search" },
  { code: "FRSM", label: "Social Media" },
  { code: "FRFB", label: "Facebook" },
  { code: "FROSM", label: "LinkedIn" },
  { code: "FRCOL", label: "Colleague / Referral" },
  { code: "FRPART", label: "Event Partner" },
  { code: "FRAD", label: "Advertisement" },
  { code: "FROT", label: "Other" },
] as const;

export const OTHER_REFERRAL_CODE = "FROT";

export const freeTicketSchema = z
  .object({
    first_name: z.string().trim().min(1, "First name is required"),
    last_name: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("Please enter a valid email address"),
    phone: z.string().trim().min(1, "Mobile number is required"),
    business: z.string().trim().optional().or(z.literal("")),
    position: z.string().trim().optional().or(z.literal("")),
    /** Maps to find_events_rsvp.workphone — legacy "Work number". */
    work_phone: z.string().trim().optional().or(z.literal("")),
    /** Maps to find_events_rsvp.linkedin_user_profile. */
    linkedin_profile: z.string().trim().optional().or(z.literal("")),
    interest: z.string().trim().optional().or(z.literal("")),
    /** Maps to find_events_rsvp.referral_mstr_id — see REFERRAL_SOURCE_OPTIONS above. */
    referral_mstr_id: z.string().trim().optional().or(z.literal("")),
    /** Maps to find_events_rsvp.visitor_referrer_from — only shown/required when
     * referral_mstr_id === OTHER_REFERRAL_CODE, exactly like the legacy form. */
    referrer_from: z.string().trim().optional().or(z.literal("")),
    /** Maps to find_events_rsvp.referral_code — legacy "referral code handed over by our partners". */
    referral_code: z.string().trim().optional().or(z.literal("")),
    /** Maps to find_events_rsvp.visitor_why_exhibit — legacy "interested in exhibiting/sponsorship?". */
    why_exhibit: z.string().trim().optional().or(z.literal("")),
    /** Maps to find_events_rsvp.visitor_is_webinars/workshops/e_magazine/newsletter/business_presentation. */
    is_webinars: z.boolean().optional().default(false),
    is_workshops: z.boolean().optional().default(false),
    is_e_magazine: z.boolean().optional().default(false),
    is_newsletter: z.boolean().optional().default(false),
    is_business_presentation: z.boolean().optional().default(false),
    /** Legacy visitor_confirm_this — a submit gate only, never persisted (the legacy PHP never
     * copies it into the $data array it hands to Events::rsvp_new() either). */
    confirm: z.boolean().refine((v) => v === true, {
      message: "Please tick this box to confirm you have read and understood this",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.referral_mstr_id === OTHER_REFERRAL_CODE && !data.referrer_from?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["referrer_from"],
        message: "Please tell us where you heard about the show",
      });
    }
  });

export type FreeTicketInput = z.infer<typeof freeTicketSchema>;
