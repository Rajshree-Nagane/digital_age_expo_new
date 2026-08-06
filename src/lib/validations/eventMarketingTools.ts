import { z } from "zod";

const optionalUrl = z.string().trim().max(500).optional().or(z.literal(""));

/** Mirrors the fixed custom_&lt;id&gt; asset links members/event_marketing_tools.php reads from
 * find_event_about_show (a shared "extra fields" table also used by About Show / Show Info). */
export const eventMarketingToolsSchema = z.object({
  cover_image: optionalUrl,
  medium_banner_1: optionalUrl,
  medium_banner_2: optionalUrl,
  medium_banner_3: optionalUrl,
  large_banner_1: optionalUrl,
  large_banner_2: optionalUrl,
  large_banner_3: optionalUrl,
  large_square: optionalUrl,
  guest_invitation: optionalUrl,
  email_template: optionalUrl,
  editorial_100: optionalUrl,
  editorial_200: optionalUrl,
  startup_editorial_100: optionalUrl,
  startup_editorial_200: optionalUrl,
  show_logo: optionalUrl,
});

export type EventMarketingToolsInput = z.infer<typeof eventMarketingToolsSchema>;
