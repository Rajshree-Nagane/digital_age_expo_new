import Link from "next/link";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { listEventMenus } from "@/lib/cp/menus/eventMenusRepository";
import { Pagination } from "../../_components/Pagination";

const ROLE_COLUMNS: { key: "visitor" | "organiser" | "exhibitor" | "sponsor" | "speaker"; label: string }[] = [
  { key: "visitor", label: "Vis" },
  { key: "organiser", label: "Org" },
  { key: "exhibitor", label: "Exh" },
  { key: "sponsor", label: "Spo" },
  { key: "speaker", label: "Spk" },
];

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";

export default async function MemberMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requireCpPermission(CP_PERMISSIONS.MEMBER_MENU_VIEW);
  const canEdit = session.perms.includes(CP_PERMISSIONS.MEMBER_MENU_EDIT);
  const { q, page } = await searchParams;
  const currentPage = page ? Number(page) : 1;

  const { items, total, pageSize } = await listEventMenus({ page: currentPage, search: q });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider text-white">Member Menu Manager</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {total} item(s) — find_event_menus. Controls navigation inside the members dashboard, per role.
          </p>
        </div>
        {canEdit && (
          <Link
            href="/cp/member-menu/new"
            className="rounded-full bg-brand-pink px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-brand-pink/20"
          >
            Add Item
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
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Group</th>
              {ROLE_COLUMNS.map((r) => (
                <th key={r.key} className="px-2 py-3 text-center" title={r.label}>
                  {r.label}
                </th>
              ))}
              <th className="px-4 py-3">Visible</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item) => (
              <tr key={item.id} className="text-zinc-300">
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3 text-zinc-500">{item.link}</td>
                <td className="px-4 py-3 text-zinc-500">{item.menu_group || "—"}</td>
                {ROLE_COLUMNS.map((r) => (
                  <td key={r.key} className="px-2 py-3 text-center">
                    {item[r.key] ? "✓" : ""}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <span
                    className={
                      item.visible
                        ? "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400"
                        : "rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-500"
                    }
                  >
                    {item.visible ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {canEdit && (
                    <Link href={`/cp/member-menu/${item.id}`} className="text-xs font-bold text-zinc-400 hover:text-white">
                      Edit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-600">
                  No member menu items match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/cp/member-menu" query={{ q }} />
    </div>
  );
}
