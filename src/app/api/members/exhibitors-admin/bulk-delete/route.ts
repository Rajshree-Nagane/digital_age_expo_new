import { NextResponse } from "next/server";
import { z } from "zod";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { bulkDeleteExhibitorsAdmin } from "@/lib/services/eventExhibitorAdmin";

const schema = z.object({
  ids: z.array(z.number()).min(1),
});

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can delete exhibitors." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await bulkDeleteExhibitorsAdmin(context, parsed.data.ids);
  return NextResponse.json({ success: true, count: result.count });
}
