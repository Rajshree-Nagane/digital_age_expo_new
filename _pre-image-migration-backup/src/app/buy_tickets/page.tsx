import { getDomain } from "@/lib/services/domain";
import { getEventById } from "@/lib/services/events";
import { getActiveEventTickets } from "@/lib/services/eventTickets";
import { TicketUrgency } from "@/components/home/TicketUrgency";
import { BuyTicketsClient } from "@/components/tickets/BuyTicketsClient";

export const metadata = {
  title: "Buy Tickets | Digital Age Expo",
  description: "Get your conference pass for Digital Age Expo.",
};

export default async function BuyTicketsPage() {
  const domain = await getDomain();
  const event = domain.event_id ? await getEventById(domain.event_id) : null;
  const tickets = domain.event_id ? await getActiveEventTickets(domain.event_id) : [];

  return (
    <div className="w-full bg-slate-950 text-white min-h-screen">
      {/* Hero */}
      <section
        className="relative flex items-end"
        style={{
          height: "420px",
          backgroundImage: "url(https://digitalageexpo.com/files/buy_ticket_banner1.jpg)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
        }}
      >
        <div className="absolute inset-0 bg-slate-950/50" />
        <div className="container mx-auto px-4 sm:px-6 pb-10 relative z-10">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Buy Conference Pass
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-200">
            Secure your seat at {domain.name}
            {event ? " — 26th to 28th August 2026" : ""}
          </p>
        </div>
      </section>

      {/* Real, live countdown to the event's actual start date (not a hardcoded number) */}
      {event?.date_start && (
        <TicketUrgency
          title="Hurry Up!"
          subtext="Our tickets are selling fast and exhibition stands are running out. DIGITAL AGE EXPO will start in"
          eventName={domain.name}
          targetDate={event.date_start.toISOString()}
        />
      )}

      {/* Real ticket tiers pulled from find_event_ticket, with a working request form that
          creates real find_events_rsvp + find_event_ticket_purchased records (no payment
          gateway is wired up yet, so this captures a genuine request for the organiser to
          follow up on rather than faking a completed charge). */}
      <BuyTicketsClient tickets={tickets} />
    </div>
  );
}
