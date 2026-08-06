import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventLobbyVisitorEnquirySchema } from "@/lib/validations/eventLobbyVisitorEnquiry";
import { updateEnquiry, deleteEnquiry } from "@/lib/services/eventLobbyVisitorEnquiry";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = eventLobbyVisitorEnquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await updateEnquiry(Number(id), parsed.data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update enquiry" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  try {
    const { id } = await params;
    await deleteEnquiry(Number(id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete enquiry" }, { status: 500 });
  }
}
