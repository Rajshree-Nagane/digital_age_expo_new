import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { standSpotSchema } from "@/lib/validations/eventStand";
import { updateStandSpot } from "@/lib/services/eventStand";

export async function PATCH(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "exhibitor") {
    return NextResponse.json({ error: "Only exhibitors have a virtual stand to manage." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = standSpotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateStandSpot(context, parsed.data);
  if (result.count === 0) {
    return NextResponse.json(
      { error: "No virtual stand spot has been set up for your booth yet — ask the organiser to allocate one." },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true });
}
