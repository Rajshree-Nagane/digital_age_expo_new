import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getEventNotifications, getNotificationLinkOptions } from "@/lib/services/eventNotifications";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";

export const metadata = { title: "Event Notifications" };

export default async function EventNotificationsPage() {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/event_notifications");
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

  const notifications = await getEventNotifications(context);
  const linkOptions =
    context.role === "organiser" ? await getNotificationLinkOptions(context) : { lobbies: [], exhibitors: [] };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-brand-pink" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Communications</p>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Event Notifications</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">
          {context.role === "organiser"
            ? "Broadcast push notifications to everyone visiting this event."
            : "Notifications sent out to attendees for this event."}
        </p>
      </div>

      <div>
        <NotificationsPanel notifications={notifications} canManage={context.role === "organiser"} linkOptions={linkOptions} />
      </div>
    </div>
  );
}
