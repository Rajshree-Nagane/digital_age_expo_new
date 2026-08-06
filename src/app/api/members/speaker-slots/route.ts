import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getSpeakerSlots, getAssignableSpeakers } from "@/lib/services/eventSpeakerSlots";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const [slots, speakers] = await Promise.all([getSpeakerSlots(context), getAssignableSpeakers(context)]);

  return NextResponse.json({ slots, speakers });
}
