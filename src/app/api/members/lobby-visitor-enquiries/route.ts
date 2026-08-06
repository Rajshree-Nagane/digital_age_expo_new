import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventLobbyVisitorEnquirySchema } from "@/lib/validations/eventLobbyVisitorEnquiry";
import { getEnquiries, createEnquiry } from "@/lib/services/eventLobbyVisitorEnquiry";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  try {
    const enquiries = await getEnquiries(context);
    return NextResponse.json({ enquiries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch enquiries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  try {
    const body = await request.json();
    const parsed = eventLobbyVisitorEnquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const created = await createEnquiry(context, parsed.data);
    return NextResponse.json({ success: true, id: created.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create enquiry" }, { status: 500 });
  }
}
