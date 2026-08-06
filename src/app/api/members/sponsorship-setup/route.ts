import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import {
  getSponsorshipSetupRows,
  getSponsorshipSetupStats,
  createSponsorshipSetupItem,
  bulkActionSponsorshipSetup,
} from "@/lib/services/eventSponsorshipSetup";

export async function GET(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  const items = await getSponsorshipSetupRows(context.eventId);
  const stats = await getSponsorshipSetupStats(context.eventId);

  return NextResponse.json({ items, stats });
}

export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can manage sponsorship setup." }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const created = await createSponsorshipSetupItem(context.eventId, body);
    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create sponsorship item" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can manage sponsorship setup." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, ids, bulkData } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Action and non-empty IDs array are required." }, { status: 400 });
    }

    await bulkActionSponsorshipSetup(context.eventId, action, ids.map(Number), bulkData);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Bulk action failed" }, { status: 500 });
  }
}
