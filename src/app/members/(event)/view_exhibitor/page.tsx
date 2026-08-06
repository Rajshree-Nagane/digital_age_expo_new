import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getExhibitorsAdmin, getExhibitorsAdminStats } from "@/lib/services/eventExhibitorAdmin";
import { ExhibitorsAdminManager } from "@/components/dashboard/ExhibitorsAdminManager";

export const metadata = { title: "View Exhibitor" };

export default async function ViewExhibitorPage() {
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
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">View Exhibitor</h1>
        <div className="glass-panel rounded-3xl p-12 text-center border-dashed">
          <p className="text-zinc-500 font-medium italic">
            Exhibitor management is only available to the event organiser.
          </p>
        </div>
      </div>
    );
  }

  const [exhibitors, initialStats] = await Promise.all([
    getExhibitorsAdmin(context),
    getExhibitorsAdminStats(context),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">View Exhibitor</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">
          Manage, allocate stands, configure digital booths, and track every exhibitor registered for this event.
        </p>
      </div>

      <div>
        <ExhibitorsAdminManager initialExhibitors={exhibitors} initialStats={initialStats} />
      </div>
    </div>
  );
}
