import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getTeamMembers } from "@/lib/services/eventTeamMembers";
import { TeamMembersManager } from "@/components/dashboard/TeamMembersManager";

export const metadata = { title: "Event Team Members" };

export default async function EventMemberPage() {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/event_member");
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

  const members = await getTeamMembers(context);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">
          {context.role === "organiser" ? "Event Team Members" : "My Team Members"}
        </h1>
        <p className="text-zinc-400 font-medium max-w-2xl">
          {context.role === "organiser"
            ? "Everyone registered as a team member across all exhibitors, speakers and sponsors for this event."
            : "Add and manage the people on your team for this event."}
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-8">
        <TeamMembersManager members={members} />
      </div>
    </div>
  );
}
