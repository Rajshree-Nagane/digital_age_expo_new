/**
 * Branding field catalog — the find_domains columns that control logo/favicon/loader/template
 * and pricing-display flags, i.e. everything in the legacy form that isn't Company or Social.
 *
 * NOTE: logo/favicon/loader fields here (alternate_logo, partner_logo, fav, domain_loader) are
 * plain text inputs holding a filename/path, matching what find_domains actually stores — this
 * page does not add file upload UI. If real upload handling is wanted later, it's additive on
 * top of these same columns (see Media Manager in the roadmap).
 */
export const BRANDING_TEXT_FIELDS = [
  {
    key: "template",
    label: "Template / Theme",
    type: "text",
    // find_domains has no color/hex column at all — `template` (a legacy template identifier
    // string, e.g. a numeric template ID) is the closest existing field to "theme". An actual
    // theme *color* setting lives on the separate Theme page (find_settings, not find_domains).
    hint: "Legacy template identifier — not a color. For an actual theme color, see the Theme page.",
  },
  { key: "alternate_logo", label: "Alternate Logo (filename)", type: "text" },
  { key: "partner_logo", label: "Partner Logo (filename)", type: "text" },
  { key: "partner_url", label: "Partner URL", type: "text" },
  { key: "fav", label: "Favicon (filename)", type: "text" },
  { key: "domain_loader", label: "Domain Loader (filename)", type: "text" },
] as const;
