import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventTeamMemberSchema } from "@/lib/validations/eventTeamMember";
import { getTeamMembers, createTeamMember } from "@/lib/services/eventTeamMembers";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const members = await getTeamMembers(context);
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const body = await request.json();
  const parsed = eventTeamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createTeamMember(context, parsed.data);
  return NextResponse.json({ success: true, id: created.id }, { status: 201 });
}
