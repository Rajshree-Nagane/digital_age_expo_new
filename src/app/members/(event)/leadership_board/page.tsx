import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getLeadershipBoardEntries } from "@/lib/services/leadershipBoard";
import { LeadershipBoardManager } from "@/components/dashboard/LeadershipBoardManager";

export const metadata = { title: "Leadership Board" };

export default async function LeadershipBoardPage() {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/leadership_board");
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

  const entries = await getLeadershipBoardEntries(context);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-brand-pink" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Event Context</p>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Leadership Board</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">
          Add business leaders, people in business, and new recruits to feature on your leadership board.
        </p>
      </div>

      <div>
        <LeadershipBoardManager entries={entries} />
      </div>
    </div>
  );
}
