import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventMarketingToolsSchema } from "@/lib/validations/eventMarketingTools";
import { getMarketingTools, updateMarketingTools } from "@/lib/services/eventMarketingTools";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const marketingTools = await getMarketingTools(context);
  return NextResponse.json({ marketingTools });
}

export async function PUT(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can edit Marketing Tools." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventMarketingToolsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateMarketingTools(context, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const marketingTools = await getMarketingTools(context);
  return NextResponse.json({ success: true, marketingTools });
}
