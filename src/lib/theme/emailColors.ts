/**
 * Color constants for transactional email HTML (find_email_templates seed content).
 *
 * Email clients render this markup outside the app's stylesheet, so CSS custom properties
 * (var(--color-*), defined in src/app/globals.css's @theme block) can't resolve here. These
 * constants duplicate the same literal values for this one email-safe context, kept in sync
 * with globals.css by hand:
 *   EMAIL_INK        <-> Tailwind's stock zinc-900 (#18181b) - same value as --color-ink
 *   EMAIL_ACCENT     <-> Tailwind's stock pink-500 (#ec4899)
 *   EMAIL_WHITE      <-> Tailwind's stock white (#ffffff)
 *   EMAIL_MUTED_TEXT <-> Tailwind's stock zinc-500 (#71717a) - same value as --color-muted-text
 */
export const EMAIL_INK = "#18181b";
export const EMAIL_ACCENT = "#ec4899";
export const EMAIL_WHITE = "#ffffff";
export const EMAIL_MUTED_TEXT = "#71717a";
