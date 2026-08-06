/**
 * General settings field catalog — the varnames stored in find_settings under
 * grouptitle="general". Split into its own file (rather than inline in page.tsx) so
 * actions.ts can iterate the same list without a client/server import cycle.
 */
export const GENERAL_SETTINGS_FIELDS = [
  { varname: "cp_site_name", label: "Website Name", type: "text", defaultValue: "" },
  { varname: "cp_site_tagline", label: "Tagline", type: "text", defaultValue: "" },
  { varname: "cp_site_url", label: "Website URL", type: "text", defaultValue: "" },
  { varname: "cp_default_timezone", label: "Default Timezone", type: "text", defaultValue: "Europe/London" },
  { varname: "cp_default_currency", label: "Default Currency", type: "text", defaultValue: "GBP" },
  { varname: "cp_default_language", label: "Default Language", type: "text", defaultValue: "en" },
  { varname: "cp_maintenance_mode", label: "Maintenance Mode (on/off)", type: "text", defaultValue: "off" },
] as const;
