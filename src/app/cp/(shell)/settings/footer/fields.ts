/** Footer field catalog — find_settings, grouptitle="footer". Copyright YEAR is deliberately not
 * a stored field: Phase 2 computes it as `new Date().getFullYear()` wherever the footer renders,
 * so it never goes stale; only the surrounding copyright TEXT is configurable here. */
export const FOOTER_TEXT_FIELDS = [
  { varname: "cp_footer_description", label: "Footer Description", kind: "textarea" },
  {
    varname: "cp_footer_copyright_text",
    label: "Copyright Text",
    kind: "text",
    hint: "The site's current year is added automatically — don't include it here.",
  },
  { varname: "cp_footer_email", label: "Footer Email", kind: "email" },
  { varname: "cp_footer_phone", label: "Footer Phone", kind: "text" },
  { varname: "cp_footer_address", label: "Footer Address", kind: "textarea" },
  { varname: "cp_footer_privacy_policy_url", label: "Privacy Policy URL", kind: "url" },
  { varname: "cp_footer_terms_url", label: "Terms & Conditions URL", kind: "url" },
  { varname: "cp_footer_cookie_policy_url", label: "Cookie Policy URL", kind: "url" },
] as const;
