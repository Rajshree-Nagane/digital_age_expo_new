import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import {
  eventRegistrationFieldSchema,
  registrationFieldToggleSchema,
} from "@/lib/validations/eventRegistrationField";
import {
  createRegistrationField,
  listRegistrationFields,
  setRegistrationFieldFlag,
} from "@/lib/services/eventRegistrationFields";

export async function GET(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  const fields = await listRegistrationFields(context);
  return NextResponse.json({ fields });
}

export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can add registration fields." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = eventRegistrationFieldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  await createRegistrationField(context, parsed.data);
  return NextResponse.json({ success: true }, { status: 201 });
}

/**
 * The three grid switches.
 *
 * The legacy page posted `update_active_field` / `update_required_field` to
 * itself. Note it also rendered a `change_login` switch but never wired up a
 * handler for it, so "Validate on Login" silently never saved — this endpoint
 * covers all three.
 */
export async function PATCH(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can change registration fields." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = registrationFieldToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { id, flag, value } = parsed.data;
  const affected = await setRegistrationFieldFlag(context, id, flag, value);
  if (affected === 0) {
    return NextResponse.json({ error: "Field not found for this event." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
