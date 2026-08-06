import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getVisitorStats } from "@/lib/services/eventVisitors";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const stats = await getVisitorStats(context);
  return NextResponse.json({ stats });
}
