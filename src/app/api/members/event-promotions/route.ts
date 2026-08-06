import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventPromotionSchema } from "@/lib/validations/eventPromotion";
import { getPromotions, createPromotion } from "@/lib/services/eventPromotions";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const promotions = await getPromotions(context);
  return NextResponse.json({ promotions });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add promotions." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventPromotionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createPromotion(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
