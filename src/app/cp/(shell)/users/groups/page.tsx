import Link from "next/link";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { listGroups } from "@/lib/cp/users/groupsRepository";
import { createGroupAction } from "./actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";

export default async function GroupsListPage() {
  const session = await requireCpPermission(CP_PERMISSIONS.USERS_GROUPS_VIEW);
  const canEdit = session.perms.includes(CP_PERMISSIONS.USERS_GROUPS_EDIT);
  const groups = await listGroups();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Roles &amp; Permissions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Backed by find_users_groups / find_users_groups_permissions_lookup — the same tables the legacy
          admin panel used for this.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Permissions Granted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {groups.map((group) => (
              <tr key={group.id} className="text-zinc-300">
                <td className="px-4 py-3 font-bold text-white">{group.name}</td>
                <td className="px-4 py-3 text-zinc-500">{group.description || "—"}</td>
                <td className="px-4 py-3">{group.memberCount}</td>
                <td className="px-4 py-3">{group.permissionCount}</td>
                <td className="px-4 py-3 text-right">
                  {canEdit && (
                    <Link href={`/cp/users/groups/${group.id}`} className="text-xs font-bold text-zinc-400 hover:text-white">
                      Edit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <form action={createGroupAction} className="flex gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
          <input name="name" placeholder="New role name" required className={FIELD_CLASS} />
          <input name="description" placeholder="Description (optional)" className={FIELD_CLASS} />
          <button
            type="submit"
            className="whitespace-nowrap rounded-xl bg-brand-pink px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95"
          >
            Add Role
          </button>
        </form>
      )}
    </div>
  );
}
