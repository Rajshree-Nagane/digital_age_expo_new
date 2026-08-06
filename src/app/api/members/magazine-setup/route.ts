import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import {
  getMagazineSetupRows,
  getMagazineSetupStats,
  getMagazineOptions,
  createMagazineSetupItem,
  bulkUpdateMagazineSetup,
  autoCalculateMagazineStats,
} from "@/lib/services/eventMagazineSetup";

export async function GET(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword") || undefined;

  const [items, stats, options] = await Promise.all([
    getMagazineSetupRows(context.eventId, keyword),
    getMagazineSetupStats(context.eventId),
    getMagazineOptions(),
  ]);

  return NextResponse.json({ items, stats, options });
}

export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can manage magazine setup." }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Check if bulk action or create
    if (body.action === "update") {
      const { updates } = body; // Record<id, { available, used }>
      const res = await bulkUpdateMagazineSetup(context.eventId, updates || {});
      return NextResponse.json({ success: true, message: `Updated ${res.updatedCount} records.` });
    }

    if (body.action === "calculate_stats") {
      const res = await autoCalculateMagazineStats(context.eventId);
      return NextResponse.json({ success: true, message: `Recalculated stats for ${res.updatedCount} items.` });
    }

    // Single create
    if (!body.magazineId || !body.eventCategoryId) {
      return NextResponse.json(
        { error: "Magazine ID (Rate Card) and Event Category ID are required." },
        { status: 400 }
      );
    }

    const created = await createMagazineSetupItem(context.eventId, body);
    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process request." }, { status: 500 });
  }
}
