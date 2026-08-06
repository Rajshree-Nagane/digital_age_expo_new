import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventSpeakerSchema } from "@/lib/validations/eventSpeaker";
import {
  getSpeakers,
  getSpeakerStats,
  createSpeaker,
  bulkUpdateSpeakerStatus,
  bulkDeleteSpeakers,
} from "@/lib/services/eventSpeakers";

export async function GET(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("filter") || undefined;

  const [speakers, stats] = await Promise.all([
    getSpeakers(context, statusFilter),
    getSpeakerStats(context),
  ]);

  return NextResponse.json({ speakers, stats });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add speakers." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventSpeakerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createSpeaker(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can perform bulk actions." }, { status: 403 });
  }

  const body = await request.json();
  const { ids, action } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No speaker IDs provided for bulk action." }, { status: 400 });
  }

  if (action === "approve") {
    await bulkUpdateSpeakerStatus(context, ids, "active");
  } else if (action === "disapprove" || action === "pending") {
    await bulkUpdateSpeakerStatus(context, ids, "pending");
  } else if (action === "reject") {
    await bulkUpdateSpeakerStatus(context, ids, "reject");
  } else if (action === "delete") {
    await bulkDeleteSpeakers(context, ids);
  } else {
    return NextResponse.json({ error: "Invalid action type." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

