import Link from "next/link";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { listMenuLinks, listTopLevelLinks } from "@/lib/cp/menus/menuLinksRepository";
import { Pagination } from "../../_components/Pagination";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";

export default async function MenuManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requireCpPermission(CP_PERMISSIONS.MENU_MANAGER_VIEW);
  const canEdit = session.perms.includes(CP_PERMISSIONS.MENU_MANAGER_EDIT);
  const { q, page } = await searchParams;
  const currentPage = page ? Number(page) : 1;

  // Parent names are looked up from the full top-level set (not just the current page) since
  // a link's parent may live on a different page than the link itself.
  const [{ links, total, pageSize }, topLevel] = await Promise.all([
    listMenuLinks({ page: currentPage, search: q }),
    listTopLevelLinks(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const byId = new Map(topLevel.map((l) => [l.id, l]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider text-white">Menu Manager</h1>
          <p className="mt-1 text-sm text-zinc-500">{total} link(s) — find_menu_links.</p>
        </div>
        {canEdit && (
          <Link
            href="/cp/menu-manager/new"
            className="rounded-full bg-brand-pink px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-brand-pink/20"
          >
            Add Link
          </Link>
        )}
      </div>

      <form className="flex gap-3">
        <input name="q" defaultValue={q} placeholder="Search title or link..." className={FIELD_CLASS} />
        <button
          type="submit"
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {links.map((link) => (
              <tr key={link.id} className="text-zinc-300">
                <td className="px-4 py-3">
                  {link.parent_id && <span className="mr-1 text-zinc-600">&rarr;</span>}
                  {link.title}
                </td>
                <td className="px-4 py-3 text-zinc-500">{link.link}</td>
                <td className="px-4 py-3 text-zinc-500">{link.parent_id ? byId.get(link.parent_id)?.title ?? "—" : "—"}</td>
                <td className="px-4 py-3">{link.ordering}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      link.active
                        ? "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400"
                        : "rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-500"
                    }
                  >
                    {link.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {canEdit && (
                    <Link href={`/cp/menu-manager/${link.id}`} className="text-xs font-bold text-zinc-400 hover:text-white">
                      Edit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-600">
                  No menu links match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/cp/menu-manager" query={{ q }} />
    </div>
  );
}
