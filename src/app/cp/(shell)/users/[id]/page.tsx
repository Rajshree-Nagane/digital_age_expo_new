import { notFound } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { getUserForEdit } from "@/lib/cp/users/usersRepository";
import { prisma } from "@/lib/prisma";
import { updateUserAction } from "../actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCpPermission(CP_PERMISSIONS.USERS_EDIT);
  const { id } = await params;
  const userId = Number(id);

  const [user, allGroups] = await Promise.all([
    getUserForEdit(userId),
    prisma.find_users_groups.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!user) notFound();

  const updateWithId = updateUserAction.bind(null, userId);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Edit User</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {user.login} &middot; find_users.id={user.id} &middot; status: {user.user_status}
        </p>
      </div>

      <form action={updateWithId} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>First Name</label>
            <input name="user_first_name" defaultValue={user.user_first_name} className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Last Name</label>
            <input name="user_last_name" defaultValue={user.user_last_name} className={FIELD_CLASS} />
          </div>
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS}>Email</label>
          <input name="user_email" type="email" defaultValue={user.user_email} className={FIELD_CLASS} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Phone</label>
            <input name="user_phone" defaultValue={user.user_phone} className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Organization</label>
            <input name="user_organization" defaultValue={user.user_organization} className={FIELD_CLASS} />
          </div>
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS}>Role(s)</label>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
            {allGroups.map((group) => (
              <label key={group.id} className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name="groupIds"
                  value={group.id}
                  defaultChecked={user.groupIds.includes(group.id)}
                  className="rounded border-white/20 bg-transparent"
                />
                {group.name}
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
    </div>
  );
}
