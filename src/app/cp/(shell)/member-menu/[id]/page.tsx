import { notFound } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { getEventMenuForEdit } from "@/lib/cp/menus/eventMenusRepository";
import { updateEventMenuAction, deleteEventMenuAction } from "../actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";

const ROLE_FLAGS = [
  { name: "visitor", label: "Visitor" },
  { name: "organiser", label: "Organiser" },
  { name: "exhibitor", label: "Exhibitor" },
  { name: "sponsor", label: "Sponsor" },
  { name: "speaker", label: "Speaker" },
  { name: "partner", label: "Partner" },
  { name: "marketer", label: "Marketer" },
] as const;

export default async function EditMemberMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCpPermission(CP_PERMISSIONS.MEMBER_MENU_EDIT);
  const { id } = await params;
  const itemId = Number(id);

  const item = await getEventMenuForEdit(itemId);
  if (!item) notFound();

  const updateWithId = updateEventMenuAction.bind(null, itemId);
  const deleteWithId = deleteEventMenuAction.bind(null, itemId);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-black uppercase tracking-wider text-white">Edit Member Menu Item</h1>

      <form action={updateWithId} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Title</label>
          <input name="title" defaultValue={item.title ?? ""} required className={FIELD_CLASS} />
        </div>
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Link (URL or path)</label>
          <input name="link" defaultValue={item.link} required className={FIELD_CLASS} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Menu Group (optional)</label>
            <input name="menu_group" defaultValue={item.menu_group ?? ""} className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Order</label>
            <input name="sequence" type="number" defaultValue={item.sequence ?? 0} className={FIELD_CLASS} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Icon (optional)</label>
            <input name="icon" defaultValue={item.icon} className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Color</label>
            <input name="color" defaultValue={item.color ?? "primary"} className={FIELD_CLASS} />
          </div>
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS}>Visible to which member roles?</label>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
            {ROLE_FLAGS.map((r) => (
              <label key={r.name} className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name={r.name}
                  defaultChecked={!!item[r.name]}
                  className="rounded border-white/20 bg-transparent"
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" name="visible" defaultChecked={item.visible} className="rounded border-white/20 bg-transparent" />
          Visible (master on/off switch)
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

      <form action={deleteWithId} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <button type="submit" className="text-xs font-bold text-red-500 hover:text-red-400">
          Delete this item
        </button>
      </form>
    </div>
  );
}
