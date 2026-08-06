import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { getDomainSettings } from "@/lib/cp/settings/domainRepository";
import { SOCIAL_MEDIA_FIELDS } from "./fields";
import { saveSocialMediaAction } from "./actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";

/** Social Media links — reads/writes find_domains directly, same one row Company Details edits. */
export default async function SocialMediaPage() {
  await requireCpPermission(CP_PERMISSIONS.SETTINGS_VIEW);
  const domain = await getDomainSettings();
  const values: Record<string, string> = {
    facebook: domain.facebook ?? "",
    instagram: domain.instagram ?? "",
    youtube: domain.youtube ?? "",
    google: domain.google ?? "",
    twitter: domain.twitter ?? "",
    linkedin: domain.linkedin ?? "",
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Social Media</h1>
        <p className="mt-1 text-sm text-zinc-500">Stored directly on find_domains — the same row Company Details edits.</p>
      </div>

      <form action={saveSocialMediaAction} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        {SOCIAL_MEDIA_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className={LABEL_CLASS}>{field.label}</label>
            <input name={field.key} defaultValue={values[field.key]} className={FIELD_CLASS} />
          </div>
        ))}

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
