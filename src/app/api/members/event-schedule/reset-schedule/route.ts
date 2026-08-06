import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { resetScheduleByEventId } from "@/lib/services/eventSchedule";

export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can reset schedule." }, { status: 403 });
  }

  try {
    const result = await resetScheduleByEventId(context.eventId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Reset schedule failed" }, { status: 500 });
  }
}
