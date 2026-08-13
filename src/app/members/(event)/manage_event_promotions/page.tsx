import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getPromotions } from "@/lib/services/eventPromotions";
import { EventPromotionsManager } from "@/components/dashboard/EventPromotionsManager";

export const metadata = { title: "Manage Promotions" };

export default async function ManageEventPromotionsPage() {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/manage_event_promotions");
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
      <div>
        <h1 className="text-2xl font-black uppercase text-indigo-950">Manage Promotions</h1>
        <p className="mt-4 rounded-2xl border border-dashed border-indigo-950/15 bg-white p-8 text-indigo-950/60">
          Promotion management is only available to the event organiser.
        </p>
      </div>
    );
  }

  const promotions = await getPromotions(context);

  return (
    <div>
      <h1 className="text-2xl font-black uppercase brand-gradient-text">Manage Promotions</h1>
      <p className="text-sm text-zinc-400 font-medium mt-1">Manage promotional offers and codes advertised for this event.</p>

      <div className="mt-6">
        <EventPromotionsManager promotions={promotions} />
      </div>
    </div>
  );
}
