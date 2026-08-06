import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getExhibitorsAdminStats } from "@/lib/services/eventExhibitorAdmin";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const stats = await getExhibitorsAdminStats(context);
  return NextResponse.json({ stats });
}
