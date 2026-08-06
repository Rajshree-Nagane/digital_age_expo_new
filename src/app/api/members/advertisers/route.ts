import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventAdvertiserSchema } from "@/lib/validations/eventAdvertiser";
import { prisma } from "@/lib/prisma";
import {
  getAdvertisers,
  getAdvertiserStats,
  createAdvertiser,
  bulkUpdateStatus,
  bulkDelete,
  bulkFlag,
  copyAdvertiser,
  importFromPreviousEvent,
  importFromAllEvents,
} from "@/lib/services/eventAdvertiser";

export async function GET(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { searchParams } = new URL(request.url);
  const onlyStats = searchParams.get("stats") === "true";

  if (onlyStats) {
    const stats = await getAdvertiserStats(context);
    return NextResponse.json({ stats });
  }

  const [advertisers, stats] = await Promise.all([
    getAdvertisers(context),
    getAdvertiserStats(context),
  ]);

  return NextResponse.json({ advertisers, stats });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can perform this action." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    if (action === "copy") {
      const idStr = searchParams.get("id");
      if (!idStr) {
        return NextResponse.json({ error: "Advertiser ID is required for copy action." }, { status: 400 });
      }
      const copied = await copyAdvertiser(context, Number(idStr));
      return NextResponse.json({ success: true, id: copied.id });
    }

    if (action === "import_previous") {
      const event = await prisma.find_events.findUnique({
        where: { id: context.eventId },
        select: { previous_event_id: true },
      });
      const previousEventId = event?.previous_event_id;
      if (!previousEventId || previousEventId === 0) {
        return NextResponse.json({ error: "No previous event is configured for this event." }, { status: 400 });
      }
      const count = await importFromPreviousEvent(context, previousEventId);
      return NextResponse.json({ success: true, count });
    }

    if (action === "import_all") {
      const count = await importFromAllEvents(context);
      return NextResponse.json({ success: true, count });
    }

    if (action === "bulk_status") {
      const { ids, status } = await request.json();
      if (!Array.isArray(ids) || ids.length === 0 || !status) {
        return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
      }
      await bulkUpdateStatus(context, ids, status);
      return NextResponse.json({ success: true });
    }

    if (action === "bulk_delete") {
      const { ids } = await request.json();
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
      }
      await bulkDelete(context, ids);
      return NextResponse.json({ success: true });
    }

    if (action === "bulk_flag") {
      const { ids, flag } = await request.json();
      if (!Array.isArray(ids) || ids.length === 0 || flag === undefined) {
        return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
      }
      await bulkFlag(context, ids, !!flag);
      return NextResponse.json({ success: true });
    }

    // Default action: Create single advertiser
    const body = await request.json();
    const parsed = eventAdvertiserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const created = await createAdvertiser(context, parsed.data);
    return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred." }, { status: 500 });
  }
}
