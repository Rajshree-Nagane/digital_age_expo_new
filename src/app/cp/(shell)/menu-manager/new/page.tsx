import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { listTopLevelLinks } from "@/lib/cp/menus/menuLinksRepository";
import { createMenuLinkAction } from "../actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";

export default async function NewMenuLinkPage() {
  await requireCpPermission(CP_PERMISSIONS.MENU_MANAGER_EDIT);
  const topLevel = await listTopLevelLinks();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-black uppercase tracking-wider text-white">Add Menu Link</h1>

      <form action={createMenuLinkAction} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Title</label>
          <input name="title" required className={FIELD_CLASS} />
        </div>
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Link (URL or path)</label>
          <input name="link" required placeholder="/schedules" className={FIELD_CLASS} />
        </div>
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Parent (optional — makes this a sub-menu item)</label>
          <select name="parent_id" className={FIELD_CLASS} defaultValue="">
            <option value="">— Top level —</option>
            {topLevel.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Order</label>
            <input name="ordering" type="number" defaultValue={0} className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Target</label>
            <select name="target" defaultValue="_self" className={FIELD_CLASS}>
              <option value="_self">Same tab</option>
              <option value="_blank">New tab</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Icon (optional)</label>
            <input name="icon" className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Color (optional)</label>
            <input name="color" className={FIELD_CLASS} />
          </div>
        </div>
        <div className="flex gap-6 text-sm text-zinc-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="active" defaultChecked className="rounded border-white/20 bg-transparent" />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="logged_in" defaultChecked className="rounded border-white/20 bg-transparent" />
            Show to signed-in members
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="logged_out" defaultChecked className="rounded border-white/20 bg-transparent" />
            Show to visitors
          </label>
        </div>
        <div className="flex justify-end border-t border-white/5 pt-6">
          <button
            type="submit"
            className="rounded-full bg-brand-pink px-10 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
