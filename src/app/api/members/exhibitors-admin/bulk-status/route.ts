import { NextResponse } from "next/server";
import { z } from "zod";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { bulkUpdateExhibitorAdminStatus } from "@/lib/services/eventExhibitorAdmin";
import { EXHIBITOR_STATUSES } from "@/lib/validations/eventExhibitorAdmin";

const schema = z.object({
  ids: z.array(z.number()).min(1),
  status: z.enum(EXHIBITOR_STATUSES),
});

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can update exhibitors." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await bulkUpdateExhibitorAdminStatus(context, parsed.data.ids, parsed.data.status);
  return NextResponse.json({ success: true, count: result.count });
}
