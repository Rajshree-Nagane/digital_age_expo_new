import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getAboutUsForm, upsertAboutUs } from "@/lib/services/eventAboutUs";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can view About Show." }, { status: 403 });
  }

  const form = await getAboutUsForm(context);
  return NextResponse.json({ form });
}

export async function PUT(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can edit About Show." }, { status: 403 });
  }

  const body = await request.json();
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const result = await upsertAboutUs(context, body as Record<string, string>);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json({ success: true });
}
