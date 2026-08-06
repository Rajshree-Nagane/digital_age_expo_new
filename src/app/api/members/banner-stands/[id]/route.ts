import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventBannerStandSchema } from "@/lib/validations/eventBannerStand";
import {
  updateBannerStand,
  updateBannerStandAmount,
  deleteBannerStand,
} from "@/lib/services/eventBannerStands";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { id } = await params;
  const body = await request.json();

  if (body.action === "change_amount") {
    const { stand_price, discount, charitable_amount, exchange_amount } = body;
    const result = await updateBannerStandAmount(context, Number(id), {
      standPrice: Number(stand_price) || 0,
      discount: Number(discount) || 0,
      charitableAmount: Number(charitable_amount) || 0,
      exchangeAmount: Number(exchange_amount) || 0,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Record not found or access denied." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  const parsed = eventBannerStandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateBannerStand(context, Number(id), parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Record not found or access denied." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { id } = await params;
  const result = await deleteBannerStand(context, Number(id));

  if (result.count === 0) {
    return NextResponse.json({ error: "Record not found or access denied." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
