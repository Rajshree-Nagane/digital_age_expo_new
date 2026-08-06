import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { faqPermissionSchema } from "@/lib/validations/eventFaq";
import { setFaqPermission } from "@/lib/services/eventFaqDisplay";

export async function PATCH(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only organisers can manage FAQ visibility." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = faqPermissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await setFaqPermission(context, parsed.data.field_key, parsed.data.published);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, published: result.published });
}
