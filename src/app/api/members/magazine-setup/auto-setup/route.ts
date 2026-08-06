import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { autoSetupMagazine } from "@/lib/services/eventMagazineSetup";

export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can auto setup magazine pages." }, { status: 403 });
  }

  try {
    const result = await autoSetupMagazine(context.eventId);
    return NextResponse.json({ success: true, insertedCount: result.insertedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to auto setup magazine pages." }, { status: 500 });
  }
}
