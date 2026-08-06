import { z } from "zod";

// Every column on find_event_faqs_permission other than id/user_id/event_id — mirrors the exact
// set of "about_show" FAQ field_keys the legacy schema hardcodes as real DB columns (rather than
// a generic key/value table). Whitelisting against this exact list (instead of trusting whatever
// string the client posts, like the legacy ajax.php's `Update find_event_faqs_permission set
// $name=...` did with zero validation) keeps the write path safe from arbitrary-column injection.
export const FAQ_PERMISSION_FIELDS = [
  "access",
  "advertise",
  "animal",
  "audio",
  "baby_changing",
  "banking",
  "business_services",
  "catering",
  "chauffer",
  "cleaning",
  "cloakroom",
  "convenience",
  "nursery",
  "deliveries",
  "disabled",
  "first_aid",
  "florish",
  "frieght",
  "graphics",
  "health",
  "internet",
  "it",
  "lift",
  "lost_property",
  "parking",
  "pharmacy",
  "photocoping",
  "post",
  "printing",
  "public_service",
  "shell_scheme_stand",
  "shell_scheme_health",
  "smoking",
  "space_freebuild",
  "space_only_stands",
  "stationary_supplies",
  "sustainability",
  "taxi",
  "telephone",
  "toilet",
  "traffic",
] as const;

export type FaqPermissionField = (typeof FAQ_PERMISSION_FIELDS)[number];

export const faqPermissionSchema = z.object({
  field_key: z.enum(FAQ_PERMISSION_FIELDS),
  published: z.boolean(),
});
export type FaqPermissionInput = z.infer<typeof faqPermissionSchema>;

export const eventFaqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});
export type EventFaqInput = z.infer<typeof eventFaqSchema>;
