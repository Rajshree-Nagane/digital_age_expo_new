import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import {
  getTradestandSetupRows,
  getTradestandSetupStats,
  getTradestandOptions,
  createTradestandSetupItem,
  bulkActionTradestandSetup,
} from "@/lib/services/eventTradestandSetup";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const items = await getTradestandSetupRows(context.eventId);
  const stats = await getTradestandSetupStats(context.eventId);
  const options = await getTradestandOptions();

  return NextResponse.json({ items, stats, options });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can manage tradestand setup." }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.tradestandId || !body.eventCategoryId) {
      return NextResponse.json({ error: "Tradestand and Event Category are required." }, { status: 400 });
    }

    const created = await createTradestandSetupItem(context.eventId, body);
    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create tradestand item" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can manage tradestand setup." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, ids, bulkData } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required." }, { status: 400 });
    }

    await bulkActionTradestandSetup(context.eventId, action, Array.isArray(ids) ? ids.map(Number) : [], bulkData);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Bulk action failed" }, { status: 500 });
  }
}
