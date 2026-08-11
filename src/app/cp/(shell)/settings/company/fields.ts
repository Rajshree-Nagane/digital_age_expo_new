/**
 * Company Details field catalog — maps onto find_domains columns directly (see
 * domainRepository.ts). This is the CP equivalent of the legacy admin's Domain Details form's
 * "Domain Details" fieldset (name/brand/link/short_description/email/phone/address/etc.),
 * trimmed to the fields that make sense for an admin to edit day-to-day.
 *
 * This tab is also where Site Information's "Site Name / Organisation Name / Short
 * Description" live — see settings/general/fields.ts's comment for why those weren't
 * duplicated onto the General tab as well.
 */
export const COMPANY_DETAILS_FIELDS = [
  { key: "name", label: "Company / Site Name", type: "text" },
  { key: "brand", label: "Brand Name", type: "text" },
  { key: "link", label: "Domain Link", type: "text" },
  { key: "short_description", label: "Short Description", type: "textarea" },
  { key: "email", label: "Contact Email", type: "text" },
  { key: "phone", label: "Contact Phone", type: "text" },
  { key: "address", label: "Contact Address", type: "textarea" },
  { key: "index_page", label: "Index Page", type: "text" },
  { key: "parent_domain", label: "Parent Domain", type: "text" },
] as const;
