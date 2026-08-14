import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { registerFormPositionSchema } from "@/lib/validations/eventConfiguration";
import {
  getEventConfiguration,
  saveRegisterFormPosition,
} from "@/lib/services/eventConfigurations";

export async function GET(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  const configuration = await getEventConfiguration(context.eventId);
  return NextResponse.json({ configuration });
}

export async function PUT(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can change the registration form layout." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = registerFormPositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    await saveRegisterFormPosition(context, parsed.data);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("42P01") || /relation .* does not exist/i.test(message)) {
      return NextResponse.json(
        {
          error:
            'The "find_event_configurations" table does not exist yet. Run: npm run db:event-configurations',
        },
        { status: 503 },
      );
    }
    throw e;
  }

  return NextResponse.json({ success: true });
}
