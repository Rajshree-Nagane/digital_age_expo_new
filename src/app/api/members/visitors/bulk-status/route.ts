import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { VISITOR_BULK_STATUS_ACTIONS } from "@/lib/validations/eventVisitor";
import { bulkSetVisitorStatus } from "@/lib/services/eventVisitors";

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can update visitors." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0) : [];
  const status = typeof body?.status === "string" ? body.status : "";

  if (ids.length === 0) {
    return NextResponse.json({ error: "No rows were selected." }, { status: 400 });
  }
  if (!VISITOR_BULK_STATUS_ACTIONS.includes(status as (typeof VISITOR_BULK_STATUS_ACTIONS)[number])) {
    return NextResponse.json({ error: "Unrecognised status." }, { status: 400 });
  }

  const result = await bulkSetVisitorStatus(context, ids, status);
  return NextResponse.json({ success: true, count: result.count });
}
