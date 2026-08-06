import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getEventFaqs } from "@/lib/services/eventFaqDisplay";
import { EventFaqList } from "@/components/dashboard/EventFaqList";

export const metadata = { title: "Event FAQ" };

export default async function EventFaqPage() {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/event_faq");
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

  const faqData = await getEventFaqs(context);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-brand-pink" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Support Center</p>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Event FAQ</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">
          {faqData.canManage
            ? "Manage frequently asked questions to help your exhibitors navigate the event."
            : "Find answers to the most common questions about this event."}
        </p>
      </div>

      <div>
        <EventFaqList
          items={faqData.items}
          canManage={faqData.canManage}
        />
      </div>
    </div>
  );
}
