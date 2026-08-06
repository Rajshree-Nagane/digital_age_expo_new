import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getVisitors, getVisitorStats, VISITORS_PAGE_SIZE } from "@/lib/services/eventVisitors";
import { VisitorsManager } from "@/components/dashboard/VisitorsManager";

export const metadata = { title: "View Visitor" };

export default async function ViewVisitorPage() {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/view_visitor");
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const domain = await getDomain();
  const eventId = domain?.event_id ?? 1;

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  if (context.role !== "organiser") {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-brand-pink" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Restricted Access</p>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Attendee Directory</h1>
        </div>
        <div className="glass-panel rounded-3xl p-12 text-center border-dashed">
          <p className="text-zinc-500 font-medium italic">
            Visitor management is only available to the event organiser.
          </p>
        </div>
      </div>
    );
  }

  const [initialPage, stats] = await Promise.all([
    getVisitors(context, { page: 1, pageSize: VISITORS_PAGE_SIZE }),
    getVisitorStats(context),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-brand-pink" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Event Context</p>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Attendee Directory</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">Monitor and manage all visitors registered to attend this event.</p>
      </div>

      <div>
        <VisitorsManager initialPage={initialPage} initialStats={stats} />
      </div>
    </div>
  );
}
