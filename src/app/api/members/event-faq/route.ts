import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getEventFaqs } from "@/lib/services/eventFaqDisplay";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const faqs = await getEventFaqs(context);
  return NextResponse.json({ faqs });
}
