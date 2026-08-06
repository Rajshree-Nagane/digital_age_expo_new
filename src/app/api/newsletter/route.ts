import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validations/newsletter";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = newsletterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // status has no DB default — omitting it throws a Prisma validation error on every submit.
  await prisma.find_news_letter_subscriber.create({
    data: { name: parsed.data.name, email: parsed.data.email, status: "active" },
  });

  return NextResponse.json({ success: true });
}
