import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventVisitorSchema } from "@/lib/validations/eventVisitor";
import { getVisitors, createVisitor, VISITORS_PAGE_SIZE } from "@/lib/services/eventVisitors";

export async function GET(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const search = url.searchParams.get("search") ?? undefined;
  const typeFilter = url.searchParams.get("type") || url.searchParams.get("typeFilter") || undefined;

  const data = await getVisitors(context, { page, pageSize: VISITORS_PAGE_SIZE, search, typeFilter });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add visitors." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventVisitorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createVisitor(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
