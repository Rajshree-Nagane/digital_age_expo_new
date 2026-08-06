import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getLetterLogs, getLetterLogDetail } from "@/lib/services/eventLetterLogs";

export async function GET(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");

  if (idParam) {
    const detail = await getLetterLogDetail(context, Number(idParam));
    if (!detail) {
      return NextResponse.json({ error: "Letter log not found" }, { status: 404 });
    }
    return NextResponse.json({ log: detail });
  }

  const page = Number(searchParams.get("page") || "1");
  const result = await getLetterLogs(context, { page });

  return NextResponse.json(result);
}
