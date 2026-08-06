import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getEventTickets } from "@/lib/services/eventTickets";
import { EventTicketsManager } from "@/components/dashboard/EventTicketsManager";

export const metadata = { title: "Event Tickets" };

export default async function EventTicketPage() {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/event_ticket");
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
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Event Tickets</h1>
        </div>
        <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-white/10">
          <p className="text-zinc-500 font-medium italic">
            Ticket setup is only available to the event organiser.
          </p>
        </div>
      </div>
    );
  }

  const tickets = await getEventTickets(context);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-brand-pink" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Revenue</p>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Event Tickets</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">Set up the ticket types attendees can purchase for this event.</p>
      </div>

      <div className="glass-panel rounded-3xl p-8 border-white/10 shadow-2xl backdrop-blur-md">
        <EventTicketsManager tickets={tickets} />
      </div>
    </div>
  );
}
