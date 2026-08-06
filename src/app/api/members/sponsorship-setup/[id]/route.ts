import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import {
  updateSponsorshipSetupItem,
  deleteSponsorshipSetupItem,
} from "@/lib/services/eventSponsorshipSetup";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can edit sponsorship setup." }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  try {
    const body = await request.json();
    await updateSponsorshipSetupItem(context.eventId, id, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can delete sponsorship setup." }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  try {
    await deleteSponsorshipSetupItem(context.eventId, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete item" }, { status: 500 });
  }
}
