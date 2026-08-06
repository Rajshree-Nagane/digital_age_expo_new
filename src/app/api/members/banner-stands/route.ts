import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventBannerStandSchema } from "@/lib/validations/eventBannerStand";
import {
  getBannerStands,
  getBannerStandStats,
  createBannerStand,
  bulkUpdateBannerStandStatus,
  bulkDeleteBannerStands,
  getExhibitorOptionsForEvent,
} from "@/lib/services/eventBannerStands";

export async function GET(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("filter") || undefined;

  const [bannerStands, stats, exhibitors] = await Promise.all([
    getBannerStands(context, statusFilter),
    getBannerStandStats(context),
    getExhibitorOptionsForEvent(context.eventId),
  ]);

  return NextResponse.json({
    bannerStands,
    stats,
    exhibitors,
    userRole: context.role,
  });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const body = await request.json();
  const parsed = eventBannerStandSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createBannerStand(context, parsed.data);
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
    return NextResponse.json({ error: "No banner stand IDs provided." }, { status: 400 });
  }

  if (action === "approve" || action === "active") {
    await bulkUpdateBannerStandStatus(context, ids, "active");
  } else if (action === "pending" || action === "disapprove") {
    await bulkUpdateBannerStandStatus(context, ids, "pending");
  } else if (action === "reject") {
    await bulkUpdateBannerStandStatus(context, ids, "reject");
  } else if (action === "delete") {
    await bulkDeleteBannerStands(context, ids);
  } else {
    return NextResponse.json({ error: "Invalid bulk action." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
