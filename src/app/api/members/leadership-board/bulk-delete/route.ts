import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { bulkDeleteLeadershipBoardEntries } from "@/lib/services/leadershipBoard";

/** Mirrors the "Bulk Delete" checkbox form's `selected_rows` POST. */
export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0) : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "No rows were selected." }, { status: 400 });
  }

  const result = await bulkDeleteLeadershipBoardEntries(context, ids);
  return NextResponse.json({ success: true, count: result.count });
}
