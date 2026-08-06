import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import {
  updateMagazineSetupItem,
  deleteMagazineSetupItem,
} from "@/lib/services/eventMagazineSetup";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can edit magazine page setup." }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  try {
    const body = await request.json();
    await updateMagazineSetupItem(id, context.eventId, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update magazine page setup item." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only event organisers can delete magazine page setup items." }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  try {
    await deleteMagazineSetupItem(id, context.eventId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete magazine page setup item." }, { status: 500 });
  }
}
