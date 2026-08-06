import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomain } from "@/lib/services/domain";
import { exhibitorRegistrationSchema } from "@/lib/validations/exhibitorRegistration";

function generateBatchNumber() {
  return `EXH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = exhibitorRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const domain = await getDomain();
  if (!domain.event_id) {
    return NextResponse.json({ error: "No event is configured for this site." }, { status: 400 });
  }

  const { first_name, last_name, position, business, email, phone, linkedin_user_profile } = parsed.data;

  const existing = await prisma.find_event_exhibitor.findFirst({
    where: { event_id: domain.event_id, email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already applied for this event." }, { status: 409 });
  }

  const exhibitor = await prisma.find_event_exhibitor.create({
    data: {
      event_id: domain.event_id,
      batch_number: generateBatchNumber(),
      name: `${first_name} ${last_name}`,
      first_name,
      last_name,
      position,
      business,
      email,
      phone,
      linkedin_user_profile: linkedin_user_profile || null,
      status: "pending",
    },
    select: { id: true },
  });

  return NextResponse.json({ success: true, id: exhibitor.id });
}
