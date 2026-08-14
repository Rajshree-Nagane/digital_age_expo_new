import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventNewsFeedSchema } from "@/lib/validations/eventNewsFeed";
import { createNewsFeedItem, getNewsFeedItems } from "@/lib/services/eventNewsFeed";

/** Port of members/news_feed.php's list + add actions (find_feeds_external, type='internal_feed'). */
export async function GET(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  const items = await getNewsFeedItems(context);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can add news feeds." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = eventNewsFeedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createNewsFeedItem(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
