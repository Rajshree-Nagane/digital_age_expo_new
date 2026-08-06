import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getEventMeetings } from "@/lib/services/eventMeetings";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const meetings = await getEventMeetings(context);
  return NextResponse.json({ meetings });
}
