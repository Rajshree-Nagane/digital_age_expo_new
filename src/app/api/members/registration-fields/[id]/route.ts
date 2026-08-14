import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventRegistrationFieldSchema } from "@/lib/validations/eventRegistrationField";
import {
  deleteRegistrationField,
  updateRegistrationField,
} from "@/lib/services/eventRegistrationFields";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function resolveId(routeContext: RouteContext): Promise<number | null> {
  const { id } = await routeContext.params;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PUT(request: Request, routeContext: RouteContext) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can edit registration fields." },
      { status: 403 },
    );
  }

  const id = await resolveId(routeContext);
  if (id === null) return NextResponse.json({ error: "Invalid field id." }, { status: 400 });

  const body = await request.json();
  const parsed = eventRegistrationFieldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const affected = await updateRegistrationField(context, id, parsed.data);
  if (affected === 0) {
    return NextResponse.json({ error: "Field not found for this event." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, routeContext: RouteContext) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can delete registration fields." },
      { status: 403 },
    );
  }

  const id = await resolveId(routeContext);
  if (id === null) return NextResponse.json({ error: "Invalid field id." }, { status: 400 });

  // 0 rows means either "not this event's field" or "a built-in field" — the
  // service guards on is_custom = 1. Both are refusals, not server errors.
  const affected = await deleteRegistrationField(context, id);
  if (affected === 0) {
    return NextResponse.json(
      { error: "Only custom fields added by the organiser can be deleted." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
