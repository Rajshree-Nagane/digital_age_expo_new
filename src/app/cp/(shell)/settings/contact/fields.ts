/**
 * Contact Information field catalog — find_settings, grouptitle="contact". This is a genuinely
 * new section: find_domains only ever had a single email/phone/address (surfaced on the
 * Company tab, and likely what other legacy code already reads) — nothing granular enough for
 * separate support/sales inboxes, a WhatsApp number, structured address lines, or a maps link.
 * Rather than overload find_domains's single legacy fields with new meanings, this follows the
 * same "new setting the legacy schema never had a varname for" pattern the Theme page already
 * established for colors.
 */
export const CONTACT_SETTINGS_FIELDS = [
  { varname: "cp_contact_primary_email", label: "Primary Email", kind: "email" },
  { varname: "cp_contact_support_email", label: "Support Email", kind: "email" },
  { varname: "cp_contact_sales_email", label: "Sales Email", kind: "email" },
  { varname: "cp_contact_phone", label: "Phone Number", kind: "text" },
  { varname: "cp_contact_whatsapp", label: "WhatsApp Number", kind: "text" },
  { varname: "cp_contact_alternate_phone", label: "Alternate Phone", kind: "text" },
  { varname: "cp_contact_address_line1", label: "Address Line 1", kind: "text" },
  { varname: "cp_contact_address_line2", label: "Address Line 2", kind: "text" },
  { varname: "cp_contact_city", label: "City", kind: "text" },
  { varname: "cp_contact_state", label: "State / Province", kind: "text" },
  { varname: "cp_contact_country", label: "Country", kind: "text" },
  { varname: "cp_contact_postcode", label: "Postcode / ZIP", kind: "text" },
  { varname: "cp_contact_google_maps_url", label: "Google Maps URL", kind: "url" },
] as const;
