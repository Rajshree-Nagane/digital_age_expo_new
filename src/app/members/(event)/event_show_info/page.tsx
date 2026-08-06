import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getShowInfo } from "@/lib/services/eventShowInfo";
import { ShowInfoManager } from "@/components/dashboard/ShowInfoManager";

export const metadata = { title: "Show Info" };

export default async function EventShowInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/event_show_info");
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

  const { action } = await searchParams;
  const showInfo = await getShowInfo(context);
  const canManage = context.role === "organiser";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-brand-pink" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Event Context</p>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Show Information</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">
          {canManage
            ? "Publish and manage general show guidelines, dates, and information visible to your exhibitors."
            : "General event information and guidelines published by the organiser."}
        </p>
      </div>

      <div>
        <ShowInfoManager
          showInfo={showInfo}
          canManage={canManage}
          startInEditMode={canManage && (action === "edit" || !showInfo?.id)}
        />
      </div>
    </div>
  );
}
