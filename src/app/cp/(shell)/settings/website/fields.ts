/**
 * Website Behaviour toggles — find_settings, grouptitle="website". All new; nothing here
 * existed before (the old General Settings page had a free-text "maintenance mode" field that
 * nothing ever read — see general/fields.ts's comment on why it was retired).
 *
 * IMPORTANT — this page only stores these values correctly; it does NOT yet make
 * cp_website_maintenance_mode actually redirect public visitors to a maintenance page, or make
 * the other toggles hide/show anything on the public site. That's the public-site wiring pass
 * (Phase 2) agreed on separately — this phase is the CP module + correct data storage only.
 */
export const WEBSITE_TOGGLE_FIELDS = [
  { varname: "cp_website_enabled", label: "Website Enabled", defaultValue: "on" },
  { varname: "cp_website_maintenance_mode", label: "Maintenance Mode", defaultValue: "off" },
  { varname: "cp_website_registration_enabled", label: "Registration Enabled", defaultValue: "on" },
  { varname: "cp_website_nomination_enabled", label: "Nomination Enabled", defaultValue: "on" },
  { varname: "cp_website_contact_form_enabled", label: "Contact Form Enabled", defaultValue: "on" },
  { varname: "cp_website_newsletter_enabled", label: "Newsletter Enabled", defaultValue: "on" },
  { varname: "cp_website_show_social_links", label: "Show Social Links", defaultValue: "on" },
  { varname: "cp_website_show_footer", label: "Show Footer", defaultValue: "on" },
  { varname: "cp_website_show_cookie_banner", label: "Show Cookie Banner", defaultValue: "on" },
  { varname: "cp_website_show_whatsapp_button", label: "Show WhatsApp Button", defaultValue: "off" },
] as const;

export const WEBSITE_MAINTENANCE_MESSAGE_VARNAME = "cp_website_maintenance_message";
export const WEBSITE_MAINTENANCE_MESSAGE_DEFAULT =
  "We're currently performing scheduled maintenance. Please check back shortly.";
