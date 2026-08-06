import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import {
  getEventScheduleData,
  createOrUpdateEventSchedule,
  deleteEventScheduleItem,
} from "@/lib/services/eventSchedule";

export async function GET(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  const data = await getEventScheduleData(context.eventId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can modify the event schedule." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await createOrUpdateEventSchedule(context.eventId, body);
    return NextResponse.json({ success: true, item: result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update schedule" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can delete schedule items." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "Schedule ID is required." }, { status: 400 });
    }

    await deleteEventScheduleItem(context.eventId, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete schedule item" }, { status: 500 });
  }
}
