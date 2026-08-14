import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventNewsFeedSchema } from "@/lib/validations/eventNewsFeed";
import {
  deleteNewsFeedItem,
  setNewsFeedActive,
  updateNewsFeedItem,
} from "@/lib/services/eventNewsFeed";

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
      { error: "Only the event organiser can edit news feeds." },
      { status: 403 },
    );
  }

  const id = await resolveId(routeContext);
  if (id === null) return NextResponse.json({ error: "Invalid feed id." }, { status: 400 });

  const body = await request.json();
  const parsed = eventNewsFeedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // updateNewsFeedItem scopes on event_id + type, so 0 rows means it isn't this event's feed.
  const result = await updateNewsFeedItem(context, id, parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Feed not found for this event." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

/** Replaces the legacy `?action=active` / `?action=inactive` links. */
export async function PATCH(request: Request, routeContext: RouteContext) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can change a feed's status." },
      { status: 403 },
    );
  }

  const id = await resolveId(routeContext);
  if (id === null) return NextResponse.json({ error: "Invalid feed id." }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  if (typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "`active` must be true or false." }, { status: 400 });
  }

  const result = await setNewsFeedActive(context, id, body.active);
  if (result.count === 0) {
    return NextResponse.json({ error: "Feed not found for this event." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, routeContext: RouteContext) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can delete news feeds." },
      { status: 403 },
    );
  }

  const id = await resolveId(routeContext);
  if (id === null) return NextResponse.json({ error: "Invalid feed id." }, { status: 400 });

  const result = await deleteNewsFeedItem(context, id);
  if (result.count === 0) {
    return NextResponse.json({ error: "Feed not found for this event." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
