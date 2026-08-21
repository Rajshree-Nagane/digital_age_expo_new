import { optionalNumericParam } from "@/lib/searchParams";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getLetterLogs } from "@/lib/services/eventLetterLogs";
import { LetterLogsManager } from "@/components/dashboard/LetterLogsManager";
import { DEFAULT_EVENT_ID } from "@/lib/site-config";

export const metadata = { title: "Letter Logs" };

export default async function EventLetterLogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ event_id?: string; page?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const queryEventId = optionalNumericParam(resolvedParams.event_id);
  const page = resolvedParams.page ? Number(resolvedParams.page) : 1;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : -30;

  const domain = await getDomain();
  const eventId = queryEventId || domain?.event_id || DEFAULT_EVENT_ID;

  const context = (await getEventMemberContext(eventId, userId)) ?? {
    role: "organiser",
    eventId,
    userId,
  };

  const letterLogsData = await getLetterLogs(context, { page });

  return (
    <div>
      <LetterLogsManager initialData={letterLogsData} eventId={eventId} />
    </div>
  );
}
