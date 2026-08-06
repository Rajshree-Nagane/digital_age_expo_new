import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { industrySchema } from "@/lib/validations/eventIndustry";
import { updateIndustry, deleteIndustry } from "@/lib/services/eventIndustry";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only organisers manage the industry list." }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || !Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid industry id." }, { status: 400 });
  }

  const body = await request.json();
  const parsed = industrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const industry = await updateIndustry(id, parsed.data);
    return NextResponse.json({ industry });
  } catch (err) {
    console.error("[event-industry] update failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update this industry." },
      { status: 404 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only organisers manage the industry list." }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || !Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid industry id." }, { status: 400 });
  }

  try {
    await deleteIndustry(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[event-industry] delete failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete this industry." },
      { status: 404 }
    );
  }
}
