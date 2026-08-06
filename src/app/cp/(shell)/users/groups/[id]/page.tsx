import { notFound } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { getGroupForEdit } from "@/lib/cp/users/groupsRepository";
import { updateGroupAction, deleteGroupAction } from "../actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";

/** Human-readable labels for this CP's permission catalog (see CP_PERMISSIONS in lib/cp/rbac.ts). */
const PERMISSION_LABELS: Record<string, string> = {
  admin_login: "Sign in to the Admin CP at all (master switch for this role)",
  admin_settings_view: "View Project Settings",
  admin_settings_edit: "Edit Project Settings",
  admin_users_view: "View users",
  admin_users_edit: "Add / edit users",
  admin_users_delete: "Suspend / reactivate users",
  admin_users_groups_view: "View roles & permissions",
  admin_users_groups_edit: "Edit roles & permissions",
  admin_users_groups_delete: "Delete roles",
  admin_events_view: "View events",
  admin_events_edit: "Create / edit events",
  admin_menu_links_view: "View site Menu Manager",
  admin_menu_links_edit: "Edit site Menu Manager",
  admin_event_menus_view: "View Member Menu Manager",
  admin_event_menus_edit: "Edit Member Menu Manager",
};

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCpPermission(CP_PERMISSIONS.USERS_GROUPS_EDIT);
  const canDelete = session.perms.includes(CP_PERMISSIONS.USERS_GROUPS_DELETE);
  const { id } = await params;
  const groupId = Number(id);

  const group = await getGroupForEdit(groupId);
  if (!group) notFound();

  const updateWithId = updateGroupAction.bind(null, groupId);
  const deleteWithId = deleteGroupAction.bind(null, groupId);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Edit Role</h1>
        <p className="mt-1 text-sm text-zinc-500">find_users_groups.id={group.id}</p>
      </div>

      <form action={updateWithId} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Role Name</label>
          <input name="name" defaultValue={group.name} required className={FIELD_CLASS} />
        </div>
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Description</label>
          <input name="description" defaultValue={group.description ?? ""} className={FIELD_CLASS} />
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS}>Permissions</label>
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            {group.permissions.map((p) => (
              <label key={p.slug} className="flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name="permissions"
                  value={p.slug}
                  defaultChecked={p.granted}
                  className="rounded border-white/20 bg-transparent"
                />
                <span>
                  {PERMISSION_LABELS[p.slug] ?? p.slug}
                  <span className="ml-2 text-[10px] text-zinc-600">({p.slug})</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-white/5 pt-6">
          <button
            type="submit"
            className="rounded-full bg-brand-pink px-10 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95"
          >
            Save
          </button>
        </div>
      </form>

      {canDelete && (
        // Deliberately a SEPARATE, sibling <form> rather than nested inside the edit form
        // above — HTML doesn't allow nested <form> elements, and each needs its own bound
        // Server Action (update vs. delete) anyway.
        <form action={deleteWithId} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-xs text-zinc-400">
            Deleting a role is only allowed while it has no members — reassign anyone still in this
            role first.
          </p>
          <button type="submit" className="mt-3 text-xs font-bold text-red-500 hover:text-red-400">
            Delete this role
          </button>
        </form>
      )}
    </div>
  );
}
