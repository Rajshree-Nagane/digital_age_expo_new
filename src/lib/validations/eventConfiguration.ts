import { z } from "zod";

/**
 * Where the register/login form sits on the registration background, as a
 * PERCENTAGE of the background's width/height — matching the legacy JS, which
 * saved `item_left * 100 / screen_width`. Percentages keep the position correct
 * across viewport sizes, which absolute pixels would not.
 */
export const registerFormPositionSchema = z.object({
  register_form_x_position: z.number().min(0).max(100),
  register_form_y_position: z.number().min(0).max(100),
});

export type RegisterFormPositionInput = z.infer<typeof registerFormPositionSchema>;

/** Used when no configuration row exists yet for the event. */
export const DEFAULT_FORM_POSITION = {
  register_form_x_position: 30,
  register_form_y_position: 25,
} as const;

/**
 * The legacy stylesheet interpolated these straight into CSS with no fallback,
 * so an event whose configuration row was missing rendered white-on-white —
 * invisible labels and an invisible border. These defaults keep the preview
 * legible until the colours are set.
 */
export const DEFAULT_FORM_TEXT_COLOR = "#ffffff";
export const DEFAULT_FORM_BORDER_COLOR = "#ffffff";

/** Only allow colours that are safe to interpolate into a style attribute. */
export function safeCssColor(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  const isHex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed);
  const isRgb = /^rgba?\(\s*[\d.\s,%/]+\)$/i.test(trimmed);
  const isNamed = /^[a-z]{3,20}$/i.test(trimmed);
  return isHex || isRgb || isNamed ? trimmed : fallback;
}
