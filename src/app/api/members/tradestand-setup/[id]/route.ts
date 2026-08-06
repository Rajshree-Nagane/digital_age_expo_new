import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import {
  updateTradestandSetupItem,
  deleteTradestandSetupItem,
} from "@/lib/services/eventTradestandSetup";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can edit tradestand setup." }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  try {
    const body = await request.json();
    await updateTradestandSetupItem(context.eventId, id, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can delete tradestand setup." }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  try {
    await deleteTradestandSetupItem(context.eventId, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete item" }, { status: 500 });
  }
}
