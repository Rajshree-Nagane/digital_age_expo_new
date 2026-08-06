import { NextRequest, NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { setFaqPermission } from "@/lib/services/eventFaqDisplay";
import { faqPermissionSchema } from "@/lib/validations/eventFaq";

export async function POST(req: NextRequest) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  try {
    const body = await req.json();
    const result = faqPermissionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { field_key, published } = result.data;
    const update = await setFaqPermission(context, field_key, published);

    if (!update.ok) {
      return NextResponse.json({ error: update.error }, { status: 403 });
    }

    return NextResponse.json({ ok: true, published: update.published });
  } catch (err) {
    console.error("FAQ Permission Error:", err);
    return NextResponse.json({ error: "System error" }, { status: 500 });
  }
}
