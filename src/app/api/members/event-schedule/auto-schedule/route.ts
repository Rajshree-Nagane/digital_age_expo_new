import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { autoScheduleByEventId } from "@/lib/services/eventSchedule";

export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can auto schedule." }, { status: 403 });
  }

  try {
    const result = await autoScheduleByEventId(context.eventId);
    return NextResponse.json({ success: true, insertedCount: result.insertedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Auto schedule failed" }, { status: 500 });
  }
}
