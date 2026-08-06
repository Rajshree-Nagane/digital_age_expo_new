import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventTeamMemberSchema } from "@/lib/validations/eventTeamMember";
import { updateTeamMember, deleteTeamMember } from "@/lib/services/eventTeamMembers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = eventTeamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateTeamMember(context, Number(id), parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { id } = await params;
  const result = await deleteTeamMember(context, Number(id));
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
