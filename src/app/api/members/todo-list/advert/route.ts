import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { todoAdvertSchema } from "@/lib/validations/eventTodoList";
import { updateTodoAdvert } from "@/lib/services/eventTodoList";

export async function PATCH(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser" && context.role !== "exhibitor") {
    return NextResponse.json({ error: "Only organisers and exhibitors manage adverts here." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = todoAdvertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateTodoAdvert(context, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
