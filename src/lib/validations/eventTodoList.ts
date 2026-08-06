import { z } from "zod";

// Fields are intentionally optional/blank-tolerant at the schema level: this form is reused in
// a "single field" deep-link mode (mirroring event_todo_list.php's task_type narrowing) where
// only one field is rendered at a time. React Hook Form still carries the *other* fields'
// original values (which may genuinely be blank — that's often why the field showed up as a
// todo item in the first place) alongside whichever field the user is editing, so a hard
// `.min(1)` here would block saves for reasons unrelated to what's on screen. The "required"
// look-and-feel is instead enforced via the `required` attribute on the rendered inputs.
const optionalText = z.string().trim().optional().or(z.literal(""));

export const todoContactSchema = z.object({
  user_first_name: optionalText,
  user_last_name: optionalText,
  user_address1: optionalText,
  user_address2: optionalText,
  user_city: optionalText,
  user_state: optionalText,
  user_country: optionalText,
  user_zip: optionalText,
  user_phone: optionalText,
  work_phone: optionalText,
});
export type TodoContactInput = z.infer<typeof todoContactSchema>;

export const todoListingSchema = z.object({
  // Carries the currently-selected listing (from the page's listing switcher / ?listing_id=)
  // back to the server, so a user with multiple listings for this event always writes to the
  // one they're actually looking at rather than whichever listing resolves first.
  listing_id: z.coerce.number().int().positive().optional(),
  title: optionalText,
  position: optionalText,
  stand_number: optionalText,
  phone: optionalText,
  website: optionalText,
  description_short: optionalText,
  description: optionalText,
  logo: optionalText,
  advertise_image: optionalText,
  facebook_page_id: optionalText,
  twitter_id: optionalText,
  google_page_id: optionalText,
  linkedin_id: optionalText,
  linkedin_company_id: optionalText,
  pinterest_id: optionalText,
  youtube_id: optionalText,
  foursquare_id: optionalText,
  instagram_id: optionalText,
});
export type TodoListingInput = z.infer<typeof todoListingSchema>;

export const ADVERT_TYPES = ["FP", "HP", "QP", "OP", "HXP", "VHP", "HQP"] as const;
export type AdvertType = (typeof ADVERT_TYPES)[number];

export const todoAdvertSchema = z.object({
  listing_id: z.coerce.number().int().positive().optional(),
  advert_size: z.enum(ADVERT_TYPES),
  enabled: z.boolean(),
  image: z.string().trim().optional().or(z.literal("")),
});
export type TodoAdvertInput = z.infer<typeof todoAdvertSchema>;

// What an uploaded image is *for* — drives both the on-disk filename (mirrors the legacy
// FILES_PATH convention of one deterministic file per listing per purpose, e.g.
// exhibitorAdvertise/fullpage_<listing_id>.<ext>) and which DB field it's destined for.
export const UPLOAD_KINDS = ["logo", "advertise_image", ...ADVERT_TYPES] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export const IMAGE_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5MB
