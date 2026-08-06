import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventNotificationSchema } from "@/lib/validations/eventNotification";
import { getEventNotifications, createEventNotification } from "@/lib/services/eventNotifications";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const notifications = await getEventNotifications(context);
  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can send notifications." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createEventNotification(context, parsed.data);
  return NextResponse.json({ success: true, id: created.id }, { status: 201 });
}
