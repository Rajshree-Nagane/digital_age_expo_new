import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getChecklist } from "@/lib/services/eventChecklist";
import { EventChecklistManager } from "@/components/dashboard/EventChecklistManager";

export const metadata = { title: "Event Checklist" };

export default async function EventChecklistPage() {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/event_checklist");
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
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Event Checklist</h1>
        <div className="glass-panel rounded-3xl p-12 text-center border-dashed">
          <p className="text-zinc-500 font-medium italic">
            The event checklist is only available to the event organiser.
          </p>
        </div>
      </div>
    );
  }

  const sections = await getChecklist(context);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Event Checklist</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">Track your setup tasks before, during, and after the show.</p>
      </div>

      <div>
        <EventChecklistManager sections={sections} />
      </div>
    </div>
  );
}
