import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { userBlogSchema } from "@/lib/validations/userBlog";
import { createBlogPost, getBlogPosts } from "@/lib/services/userBlog";

export async function GET(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  const posts = await getBlogPosts(context);
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can add blog posts." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = userBlogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createBlogPost(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
