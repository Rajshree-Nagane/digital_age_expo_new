import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { standProfileSchema } from "@/lib/validations/eventStand";
import { getMyStand, updateStandProfile } from "@/lib/services/eventStand";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const stand = await getMyStand(context);
  return NextResponse.json(stand);
}

export async function PATCH(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "exhibitor") {
    return NextResponse.json({ error: "Only exhibitors have a stand to manage." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = standProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateStandProfile(context, parsed.data);
  if (result.count === 0) {
    return NextResponse.json(
      { error: "Nothing to update — demo accounts don't have a saved stand record." },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true });
}
