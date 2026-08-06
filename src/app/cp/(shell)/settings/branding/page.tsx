import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { getDomainSettings } from "@/lib/cp/settings/domainRepository";
import { BRANDING_TEXT_FIELDS } from "./fields";
import { saveBrandingAction } from "./actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";
const HINT_CLASS = "text-xs text-zinc-600";

export default async function BrandingPage() {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_VIEW);
  const domain = await getDomainSettings();
  const values: Record<string, string> = {
    template: domain.template ?? "",
    alternate_logo: domain.alternate_logo ?? "",
    partner_logo: domain.partner_logo ?? "",
    partner_url: domain.partner_url ?? "",
    fav: domain.fav ?? "",
    domain_loader: domain.domain_loader ?? "",
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Branding</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stored directly on find_domains. For an actual theme <em>color</em> setting (find_domains has no color
          column), see the separate Theme page.
        </p>
      </div>

      <form action={saveBrandingAction} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        {BRANDING_TEXT_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className={LABEL_CLASS}>{field.label}</label>
            <input name={field.key} defaultValue={values[field.key]} className={FIELD_CLASS} />
            {"hint" in field && field.hint && <p className={HINT_CLASS}>{field.hint}</p>}
          </div>
        ))}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="show_header_brand_logo"
            defaultChecked={domain.show_header_brand_logo === 1}
            className="h-4 w-4 rounded border-white/20 bg-white/5"
          />
          <span className={LABEL_CLASS}>Show Brand Logo In Header</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="hide_pricing"
            defaultChecked={domain.hide_pricing ?? false}
            className="h-4 w-4 rounded border-white/20 bg-white/5"
          />
          <span className={LABEL_CLASS}>Hide Pricing Site-Wide</span>
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
