import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { autoSetupSponsorship } from "@/lib/services/eventSponsorshipSetup";

export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can trigger auto setup." }, { status: 403 });
  }

  try {
    const result = await autoSetupSponsorship(context.eventId);
    return NextResponse.json({ success: true, insertedCount: result.insertedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Auto setup failed" }, { status: 500 });
  }
}
