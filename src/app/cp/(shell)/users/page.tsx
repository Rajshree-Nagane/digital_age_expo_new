import Link from "next/link";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { prisma } from "@/lib/prisma";
import { listUsers, USER_SEARCH_FIELDS } from "@/lib/cp/users/usersRepository";
import { setUserStatusAction } from "./actions";
import { Pagination } from "../../_components/Pagination";
import { SuccessModal } from "../../_components/SuccessModal";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const SELECT_CLASS = FIELD_CLASS + " appearance-none";
const LABEL_CLASS = "mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500";

export default async function UsersListPage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string; keyword?: string; groupId?: string; page?: string; created?: string }>;
}) {
  const session = await requireCpPermission(CP_PERMISSIONS.USERS_VIEW);
  const canEdit = session.perms.includes(CP_PERMISSIONS.USERS_EDIT);
  const canDelete = session.perms.includes(CP_PERMISSIONS.USERS_DELETE);

  const { field, keyword, groupId, page, created } = await searchParams;
  const groupIdNum = groupId ? Number(groupId) : undefined;

  const [{ users, total, pageSize }, allGroups] = await Promise.all([
    listUsers({ page: page ? Number(page) : 1, field, keyword, groupId: groupIdNum }),
    prisma.find_users_groups.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = page ? Number(page) : 1;

  return (
    <div className="space-y-6">
      {created && <SuccessModal message="User added successfully." cleanUrl="/cp/users" />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider text-white">Users</h1>
          <p className="mt-1 text-sm text-zinc-500">{total.toLocaleString()} account(s) found.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/cp/users/groups"
            className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Roles &amp; Permissions
          </Link>
          {canEdit && (
            <Link
              href="/cp/users/new"
              className="rounded-full bg-brand-pink px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95"
            >
              Add User
            </Link>
          )}
        </div>
      </div>

      {/* Mirrors admin_users.php's own "Search in <field> for <keyword> in group <group>"
          panel — one column search against a real find_users field, rather than a fuzzy
          multi-column OR search. */}
      <form className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:grid-cols-[1fr_1.4fr_1fr_auto] sm:items-end">
        <div>
          <label className={LABEL_CLASS}>Search in</label>
          <select name="field" defaultValue={field ?? "login"} className={SELECT_CLASS}>
            {USER_SEARCH_FIELDS.map((f) => (
              <option key={f.value} value={f.value} className="bg-zinc-900">
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>For</label>
          <input name="keyword" defaultValue={keyword} placeholder="Search keyword..." className={FIELD_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>In group</label>
          <select name="groupId" defaultValue={groupId ?? ""} className={SELECT_CLASS}>
            <option value="" className="bg-zinc-900">
              All
            </option>
            {allGroups.map((g) => (
              <option key={g.id} value={g.id} className="bg-zinc-900">
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-brand-pink px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:scale-[1.02] active:scale-95"
        >
          Submit
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[1500px] text-left text-sm">
          <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">First Name</th>
              <th className="px-4 py-3">Last Name</th>
              <th className="px-4 py-3">Franchise</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role(s)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date Added</th>
              <th className="px-4 py-3 text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="text-zinc-300">
                <td className="px-4 py-3 text-zinc-500">{user.id}</td>
                <td className="px-4 py-3">
                  {canEdit ? (
                    <Link href={`/cp/users/${user.id}`} className="font-bold text-white hover:text-brand-pink">
                      {user.login}
                    </Link>
                  ) : (
                    <span className="font-bold text-white">{user.login}</span>
                  )}
                </td>
                <td className="px-4 py-3">{user.user_first_name || "—"}</td>
                <td className="px-4 py-3">{user.user_last_name || "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{user.franchiseName ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{user.user_organization || "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{user.user_country || "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{user.location ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{user.user_email}</td>
                <td className="px-4 py-3">
                  {user.groups.length === 0 ? (
                    <span className="text-zinc-600">no role</span>
                  ) : (
                    user.groups.map((g) => (
                      <span
                        key={g.id}
                        className="mr-1 mb-1 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-300"
                      >
                        {g.name}
                      </span>
                    ))
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      user.user_status === "active"
                        ? "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400"
                        : "rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-400"
                    }
                  >
                    {user.user_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">{user.createdLabel ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-3">
                    {canEdit && (
                      <Link href={`/cp/users/${user.id}`} className="text-xs font-bold text-zinc-400 hover:text-white">
                        Edit
                      </Link>
                    )}
                    {canDelete && (
                      <form action={setUserStatusAction.bind(null, user.id, user.user_status === "active" ? "suspended" : "active")}>
                        <button type="submit" className="text-xs font-bold text-zinc-400 hover:text-white">
                          {user.user_status === "active" ? "Suspend" : "Reactivate"}
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-zinc-600">
                  No users match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/cp/users" query={{ field, keyword, groupId }} />
    </div>
  );
}
