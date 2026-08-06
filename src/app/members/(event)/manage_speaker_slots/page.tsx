import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getSpeakerSlots, getAssignableSpeakers } from "@/lib/services/eventSpeakerSlots";
import { SpeakerSlotsManager } from "@/components/dashboard/SpeakerSlotsManager";

export const metadata = { title: "Manage Speaker Slots" };

export default async function ManageSpeakerSlotsPage() {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const domain = await getDomain();
  const eventId = domain?.event_id ?? 852;

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  if (context.role !== "organiser") {
    return (
      <div className="space-y-8">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Manage Speaker Slots</h1>
        <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-white/10">
          <p className="text-zinc-500 font-medium italic">
            Slot allocation is only available to the event organiser.
          </p>
        </div>
      </div>
    );
  }

  const [slots, speakers] = await Promise.all([getSpeakerSlots(context), getAssignableSpeakers(context)]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Manage Speaker&apos;s Slots</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">
          Allocate keynote sessions, workshops, and presentation slots to active speakers across event venues and halls.
        </p>
      </div>

      <div>
        <SpeakerSlotsManager initialSlots={slots} initialSpeakers={speakers} />
      </div>
    </div>
  );
}
