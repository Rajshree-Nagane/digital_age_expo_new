import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventLobbyVisitorEnquiryInput } from "@/lib/validations/eventLobbyVisitorEnquiry";

export interface EnquiryRow {
  id: number;
  layout_type_setup_id: number;
  exhibitor_id: number | null;
  name: string;
  email: string;
  mobile_no: string;
  question_description: string;
  answer: string;
  event_id: number;
  user_id: number;
  created_on: Date;
  updated_on: Date;
}

export async function getEnquiries(context: EventMemberContext): Promise<EnquiryRow[]> {
  const rows = await prisma.find_event_lobby_visitor_enquires.findMany({
    where: {
      event_id: context.eventId,
    },
    orderBy: {
      created_on: "desc",
    },
  });

  return rows as any[];
}

export async function createEnquiry(
  context: EventMemberContext,
  input: EventLobbyVisitorEnquiryInput
): Promise<EnquiryRow> {
  const row = await prisma.find_event_lobby_visitor_enquires.create({
    data: {
      name: input.name,
      email: input.email,
      mobile_no: input.mobile_no,
      question_description: input.question_description,
      answer: input.answer,
      event_id: context.eventId,
      user_id: context.userId,
      layout_type_setup_id: 0,
      exhibitor_id: null,
    },
  });

  return row as any;
}

export async function updateEnquiry(
  id: number,
  input: EventLobbyVisitorEnquiryInput
): Promise<EnquiryRow> {
  const row = await prisma.find_event_lobby_visitor_enquires.update({
    where: { id },
    data: {
      name: input.name,
      email: input.email,
      mobile_no: input.mobile_no,
      question_description: input.question_description,
      answer: input.answer,
      updated_on: new Date(),
    },
  });

  return row as any;
}

export async function deleteEnquiry(id: number): Promise<void> {
  await prisma.find_event_lobby_visitor_enquires.delete({
    where: { id },
  });
}
