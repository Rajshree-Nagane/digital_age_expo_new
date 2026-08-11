/**
 * Site Information field catalog — the varnames stored in find_settings under
 * grouptitle="general". Split into its own file (rather than inline in page.tsx) so
 * actions.ts can iterate the same list without a client/server import cycle.
 *
 * Site Name, Organisation Name, and Short Description are deliberately NOT repeated here even
 * though the original feature request listed them under "Site Information" — this site already
 * has real, typed columns for exactly those (find_domains.name / brand / short_description),
 * surfaced on the Company tab. Duplicating them into a second, unrelated find_settings row
 * would just give two places that can silently disagree about the same fact; the Company tab
 * is the one source of truth for those three, and this page says so below its form.
 *
 * cp_maintenance_mode (a free-text "on"/"off" flag) has been retired from this list — it never
 * actually gated anything (proxy.ts only ever checked the CP auth cookie), and it's superseded
 * by the real Website Behaviour tab's maintenance toggle. Its old row is simply left inert in
 * find_settings rather than deleted, in keeping with "preserve all existing data."
 */
export const GENERAL_SETTINGS_FIELDS = [
  { varname: "cp_site_name", label: "Website Name", type: "text", defaultValue: "", maxLength: 255 },
  { varname: "cp_site_title", label: "Site Title", type: "text", defaultValue: "", maxLength: 255 },
  { varname: "cp_site_tagline", label: "Tagline", type: "text", defaultValue: "", maxLength: 255 },
  { varname: "cp_full_description", label: "Full Description", type: "textarea", defaultValue: "" },
  { varname: "cp_organisation_type", label: "Business / Organisation Type", type: "text", defaultValue: "" },
  { varname: "cp_registration_number", label: "Company / Registration Number", type: "text", defaultValue: "" },
  { varname: "cp_founded_year", label: "Founded Year", type: "text", defaultValue: "" },
  { varname: "cp_site_url", label: "Website URL", type: "text", defaultValue: "" },
  { varname: "cp_default_timezone", label: "Default Timezone", type: "text", defaultValue: "Europe/London" },
  { varname: "cp_default_currency", label: "Default Currency", type: "text", defaultValue: "GBP" },
  { varname: "cp_default_language", label: "Default Language", type: "text", defaultValue: "en" },
] as const;

export type GeneralSettingsVarname = (typeof GENERAL_SETTINGS_FIELDS)[number]["varname"];
