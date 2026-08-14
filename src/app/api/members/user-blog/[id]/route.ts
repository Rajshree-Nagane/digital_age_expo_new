import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { userBlogSchema } from "@/lib/validations/userBlog";
import { deleteBlogPost, updateBlogPost } from "@/lib/services/userBlog";

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
      { error: "Only the event organiser can edit blog posts." },
      { status: 403 },
    );
  }

  const id = await resolveId(routeContext);
  if (id === null) return NextResponse.json({ error: "Invalid post id." }, { status: 400 });

  const body = await request.json();
  const parsed = userBlogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // updateBlogPost scopes on event_id, so 0 rows means the post isn't this event's.
  const result = await updateBlogPost(context, id, parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Post not found for this event." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, routeContext: RouteContext) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can delete blog posts." },
      { status: 403 },
    );
  }

  const id = await resolveId(routeContext);
  if (id === null) return NextResponse.json({ error: "Invalid post id." }, { status: 400 });

  const result = await deleteBlogPost(context, id);
  if (result.count === 0) {
    return NextResponse.json({ error: "Post not found for this event." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
