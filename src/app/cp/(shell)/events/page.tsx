import Link from "next/link";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { listEvents, getActiveEventId } from "@/lib/cp/events/eventsRepository";
import { Pagination } from "../../_components/Pagination";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";

export default async function EventsListPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireCpPermission(CP_PERMISSIONS.EVENTS_VIEW);
  const { q, page } = await searchParams;
  const [{ events, total, pageSize }, activeEventId] = await Promise.all([
    listEvents({ page: page ? Number(page) : 1, search: q }),
    getActiveEventId(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = page ? Number(page) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Event Management</h1>
        <p className="mt-1 text-sm text-zinc-500">{total} event(s). New events are created via Duplicate, from an existing event's page.</p>
      </div>

      <form className="flex gap-3">
        <input name="q" defaultValue={q} placeholder="Search title, URL, venue..." className={FIELD_CLASS} />
        <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 hover:text-white">
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((event) => (
              <tr key={event.id} className="text-zinc-300">
                <td className="px-4 py-3">
                  <span className="font-bold text-white">{event.title}</span>
                  {activeEventId === event.id && (
                    <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {event.date_start.toISOString().slice(0, 10)} &rarr; {event.date_end?.toISOString().slice(0, 10) ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-500">{event.venue}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-300">
                    {event.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/cp/events/${event.id}`} className="text-xs font-bold text-zinc-400 hover:text-white">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-600">
                  No events match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/cp/events" query={{ q }} />
    </div>
  );
}
