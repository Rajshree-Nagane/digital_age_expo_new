import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { getDomainSettings } from "@/lib/cp/settings/domainRepository";
import { COMPANY_DETAILS_FIELDS } from "./fields";
import { saveCompanyDetailsAction } from "./actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";

/**
 * Company Details — reads/writes find_domains directly (this site's one row, id=DOMAIN_ID),
 * NOT find_settings. Unlike General Settings (an EAV table keyed by varname), every field on
 * this page is a real, typed column — see domainRepository.ts.
 *
 * There is no "domain date" field anywhere on find_domains (only an auto system
 * `date_created`, not meant to be admin-edited) — if a specific date setting was meant, it
 * isn't clear which one from the legacy form pasted in chat; Event dates already live in
 * Event Management, and nothing else in find_domains looks like a user-editable date.
 */
export default async function CompanyDetailsPage() {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_VIEW);
  const domain = await getDomainSettings();
  const values: Record<string, string> = {
    name: domain.name ?? "",
    brand: domain.brand ?? "",
    link: domain.link ?? "",
    short_description: domain.short_description ?? "",
    email: domain.email ?? "",
    phone: domain.phone ?? "",
    address: domain.address ?? "",
    index_page: domain.index_page ?? "",
    parent_domain: domain.parent_domain ?? "",
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Company Details</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stored directly on find_domains — the legacy admin&apos;s own Domain Details record for this site, not a
          find_settings row.
        </p>
      </div>

      <form action={saveCompanyDetailsAction} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        {COMPANY_DETAILS_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className={LABEL_CLASS}>{field.label}</label>
            {field.type === "textarea" ? (
              <textarea name={field.key} defaultValue={values[field.key]} rows={3} className={FIELD_CLASS} />
            ) : (
              <input name={field.key} defaultValue={values[field.key]} className={FIELD_CLASS} />
            )}
          </div>
        ))}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="status"
            defaultChecked={domain.status}
            className="h-4 w-4 rounded border-white/20 bg-white/5"
          />
          <span className={LABEL_CLASS}>Domain Active</span>
        </label>

        <div className="flex justify-end border-t border-white/5 pt-6">
          <button
            type="submit"
            className="rounded-full bg-brand-pink px-10 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
