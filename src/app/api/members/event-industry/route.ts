import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { industrySchema } from "@/lib/validations/eventIndustry";
import { getIndustries, createIndustry } from "@/lib/services/eventIndustry";

export async function GET(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const search = new URL(request.url).searchParams.get("search") ?? undefined;
  const industries = await getIndustries(search);
  return NextResponse.json({ industries });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only organisers manage the industry list." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = industrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const industry = await createIndustry(parsed.data);
    return NextResponse.json({ industry }, { status: 201 });
  } catch (err) {
    console.error("[event-industry] create failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create this industry." },
      { status: 500 }
    );
  }
}
