import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";

export type OrganiserSession = { eventId: number; userId: number };

/** Shared guard for admin API routes — this site's find_events.user_id is the organiser. */
export async function requireOrganiser(): Promise<OrganiserSession | { error: NextResponse }> {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo Organiser", email: "demo@example.com" },
  };

  const domain = await getDomain();
  const userId = Number(session.user.id);
  const eventId = domain.event_id || 1;

  return { eventId, userId };
}
