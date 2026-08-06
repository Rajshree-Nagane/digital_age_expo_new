import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventMarketerSchema } from "@/lib/validations/eventMarketer";
import { getMarketers, createMarketer } from "@/lib/services/eventMarketer";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const marketers = await getMarketers(context);
  return NextResponse.json({ marketers });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add marketers." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventMarketerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createMarketer(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
