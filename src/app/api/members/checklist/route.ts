import { NextResponse } from "next/server";
import { z } from "zod";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { saveChecklistSection } from "@/lib/services/eventChecklist";

const bodySchema = z.object({ values: z.record(z.string(), z.boolean()) });

export async function PATCH(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checklist payload." }, { status: 400 });
  }

  const result = await saveChecklistSection(context, parsed.data.values);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json({ success: true });
}
