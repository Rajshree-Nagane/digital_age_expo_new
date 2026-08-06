import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { todoContactSchema } from "@/lib/validations/eventTodoList";
import { updateTodoContact } from "@/lib/services/eventTodoList";

export async function PATCH(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const body = await request.json();
  const parsed = todoContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  await updateTodoContact(context, parsed.data);
  return NextResponse.json({ success: true });
}
