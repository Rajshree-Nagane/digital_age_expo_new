import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { leadershipBoardSchema } from "@/lib/validations/leadershipBoard";
import { getLeadershipBoardEntries, createLeadershipBoardEntry } from "@/lib/services/leadershipBoard";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const entries = await getLeadershipBoardEntries(context);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const body = await request.json();
  const parsed = leadershipBoardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const created = await createLeadershipBoardEntry(context, parsed.data);
    return NextResponse.json({ success: true, id: created.id }, { status: 201 });
  } catch (err) {
    console.error("[leadership-board] create failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save this entry." },
      { status: 500 }
    );
  }
}
