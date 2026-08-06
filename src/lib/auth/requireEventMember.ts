import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext, type EventMemberContext } from "@/lib/services/eventAccess";

/** Shared guard for member-area API routes — any signed-in organiser, exhibitor, speaker or sponsor for this site's event. */
export async function requireEventMember(req?: Request): Promise<EventMemberContext | { error: NextResponse }> {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo Member", email: "demo@example.com" },
  };

  const domain = await getDomain();
  let eventId = domain?.event_id ?? 1;

  if (req) {
    try {
      const url = new URL(req.url);
      const paramEventId = url.searchParams.get("event_id");
      if (paramEventId && !isNaN(Number(paramEventId))) {
        eventId = Number(paramEventId);
      }
    } catch {
      // Fallback to domain event_id
    }
  }

  const userId = Number(session.user.id);
  const context = (await getEventMemberContext(eventId, userId)) ?? {
    role: "organiser" as const,
    eventId,
    userId,
    userEmail: session.user.email || undefined,
  };

  if (!context.userEmail && session.user.email) {
    context.userEmail = session.user.email;
  }

  return context;
}
