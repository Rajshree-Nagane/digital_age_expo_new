import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getMailLogs } from "@/lib/services/eventMailLogs";
import { EmailLogsManager } from "@/components/dashboard/EmailLogsManager";
import { DEFAULT_EVENT_ID } from "@/lib/site-config";

export const metadata = { title: "Email Logs" };

export default async function EventMailLogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ event_id?: string; page?: string; email_template_id?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const queryEventId = resolvedParams.event_id ? Number(resolvedParams.event_id) : undefined;
  const page = resolvedParams.page ? Number(resolvedParams.page) : 1;
  const templateId = resolvedParams.email_template_id || null;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : -30;

  const domain = await getDomain();
  const eventId = queryEventId || domain?.event_id || DEFAULT_EVENT_ID;

  const context = (await getEventMemberContext(eventId, userId)) ?? {
    role: "organiser",
    eventId,
    userId,
  };

  const mailLogsData = await getMailLogs(context, { page, templateId });

  return (
    <div>
      <EmailLogsManager initialData={mailLogsData} eventId={eventId} />
    </div>
  );
}
