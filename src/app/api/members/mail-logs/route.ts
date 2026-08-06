import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getMailLogs, getMailLogDetail } from "@/lib/services/eventMailLogs";

export async function GET(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");

  if (idParam) {
    const detail = await getMailLogDetail(context, Number(idParam));
    if (!detail) {
      return NextResponse.json({ error: "Email log not found" }, { status: 404 });
    }
    return NextResponse.json({ log: detail });
  }

  const page = Number(searchParams.get("page") || "1");
  const templateId = searchParams.get("email_template_id");

  const result = await getMailLogs(context, { page, templateId });
  return NextResponse.json(result);
}
