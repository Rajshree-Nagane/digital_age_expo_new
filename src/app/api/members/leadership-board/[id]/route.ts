import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { leadershipBoardSchema } from "@/lib/validations/leadershipBoard";
import { updateLeadershipBoardEntry, deleteLeadershipBoardEntry } from "@/lib/services/leadershipBoard";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = leadershipBoardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await updateLeadershipBoardEntry(context, Number(id), parsed.data);
    if (result.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[leadership-board] update failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update this entry." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { id } = await params;
  const result = await deleteLeadershipBoardEntry(context, Number(id));
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
