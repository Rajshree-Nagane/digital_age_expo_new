import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { autoSetupTradestand } from "@/lib/services/eventTradestandSetup";

export async function POST() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can trigger auto setup." }, { status: 403 });
  }

  try {
    const result = await autoSetupTradestand(context.eventId);
    return NextResponse.json({ success: true, insertedCount: result.insertedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Auto setup failed" }, { status: 500 });
  }
}
