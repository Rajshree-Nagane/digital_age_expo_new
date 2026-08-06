import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { publicationContactSchema } from "@/lib/validations/publicationContact";
import { updatePublicationContact, deletePublicationContact } from "@/lib/services/publicationContacts";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can edit publication contacts." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = publicationContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updatePublicationContact(context, Number(id), parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Publication contact not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can remove publication contacts." }, { status: 403 });
  }

  const { id } = await params;
  const result = await deletePublicationContact(context, Number(id));
  if (result.count === 0) {
    return NextResponse.json({ error: "Publication contact not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
