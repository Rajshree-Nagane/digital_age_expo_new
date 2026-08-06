import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { publicationContactSchema } from "@/lib/validations/publicationContact";
import { getPublicationContacts, createPublicationContact } from "@/lib/services/publicationContacts";

export async function GET() {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const contacts = await getPublicationContacts(context);
  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can add publication contacts." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = publicationContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created = await createPublicationContact(context, parsed.data);
  return NextResponse.json({ success: true, id: created?.id }, { status: 201 });
}
