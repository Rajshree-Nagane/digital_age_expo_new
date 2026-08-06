import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";

export interface ReportStats {
  visitorCount: number;
  exhibitorCount: number;
  activeExhibitorCount: number;
  sponsorCount: number;
  speakerCount: number;
  ticketsSold: number;
  ticketRevenue: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  unpaidInvoiceCount: number;
  paidInvoiceRevenue: number;
  unpaidInvoiceAmount: number;
  feedbackCount: number;
}

export interface PollOptionResult {
  id: number;
  text: string;
  count: number;
  percent: number;
}

export interface PollQuestionResult {
  id: number;
  question: string;
  totalResponses: number;
  options: PollOptionResult[];
}

export interface FeedbackItem {
  id: number;
  name: string | null;
  questionDescription: string | null;
  createdOn: Date | null;
}

/**
 * Aggregate event stats for the Reports dashboard. Mirrors what members/reports.php pulls
 * together (visitors, feedback, polls) plus real counts/revenue from the exhibitor, sponsor,
 * speaker, ticket and invoice tables this rebuild already has services for — the legacy page
 * itself doesn't group these into one dashboard (it's mostly CSV export triggers scoped to a
 * single exhibitor), so this is a genuine event-wide summary built from real aggregates.
 */
export async function getReportStats(context: EventMemberContext): Promise<ReportStats> {
  const eventId = context.eventId;

  const [
    visitorCount,
    exhibitorCount,
    activeExhibitorCount,
    sponsorCount,
    speakerCount,
    ticketsSold,
    ticketRevenueAgg,
    invoiceCount,
    paidInvoiceAgg,
    unpaidInvoiceAgg,
    feedbackCount,
  ] = await Promise.all([
    prisma.find_events_rsvp.count({ where: { event_id: eventId, is_deleted: 0 } }),
    prisma.find_event_exhibitor.count({ where: { event_id: eventId } }),
    prisma.find_event_exhibitor.count({ where: { event_id: eventId, status: "active" } }),
    prisma.find_event_sponsorer.count({ where: { event_id: eventId } }),
    prisma.find_speakers.count({ where: { event_id: eventId } }),
    prisma.find_event_ticket_purchased.count({ where: { event_id: eventId } }),
    prisma.find_event_ticket_purchased.aggregate({
      where: { event_id: eventId },
      _sum: { paid_amount: true },
    }),
    prisma.find_invoices.count({ where: { event_id: eventId } }),
    prisma.find_invoices.aggregate({
      where: { event_id: eventId, status: "paid" },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.find_invoices.aggregate({
      where: { event_id: eventId, status: "unpaid" },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.find_event_lobby_visitor_enquires.count({
      where: { event_id: eventId, OR: [{ exhibitor_id: null }, { exhibitor_id: 0 }] },
    }),
  ]);

  return {
    visitorCount,
    exhibitorCount,
    activeExhibitorCount,
    sponsorCount,
    speakerCount,
    ticketsSold,
    ticketRevenue: Number(ticketRevenueAgg._sum.paid_amount ?? 0),
    invoiceCount,
    paidInvoiceCount: paidInvoiceAgg._count._all,
    unpaidInvoiceCount: unpaidInvoiceAgg._count._all,
    paidInvoiceRevenue: Number(paidInvoiceAgg._sum.total ?? 0),
    unpaidInvoiceAmount: Number(unpaidInvoiceAgg._sum.total ?? 0),
    feedbackCount,
  };
}

/** Mirrors reports.php's `$feedback` — general (non exhibitor-specific) visitor enquiries. */
export async function getRecentFeedback(context: EventMemberContext, take = 6): Promise<FeedbackItem[]> {
  const rows = await prisma.find_event_lobby_visitor_enquires.findMany({
    where: { event_id: context.eventId, OR: [{ exhibitor_id: null }, { exhibitor_id: 0 }] },
    orderBy: { created_on: "desc" },
    take,
    select: { id: true, name: true, question_description: true, created_on: true },
  });
  return rows;
}

/** Mirrors reports.php's poll block: questions -> options -> response counts -> percentages. */
export async function getPollResults(context: EventMemberContext): Promise<PollQuestionResult[]> {
  const questions = await prisma.find_event_lobby_polling_questions.findMany({
    where: { event_id: context.eventId },
    select: { id: true, question: true },
    orderBy: { id: "asc" },
  });
  if (questions.length === 0) return [];

  const questionIds = questions.map((q: any) => q.id);
  const options = await prisma.find_event_lobby_polling_options.findMany({
    where: { question_id: { in: questionIds } },
    select: { id: true, question_id: true, option_text: true },
  });

  const responseCounts = await prisma.find_event_lobby_polling_response.groupBy({
    by: ["question_id", "option_id"],
    where: { question_id: { in: questionIds } },
    _count: { _all: true },
  });

  const countMap = new Map<string, number>();
  for (const r of responseCounts as any[]) {
    if (r.option_id == null) continue;
    countMap.set(`${r.question_id}-${r.option_id}`, r._count._all);
  }

  return questions.map((q: any) => {
    const qOptions = options.filter((o: any) => o.question_id === q.id);
    const totalResponses = qOptions.reduce((sum: number, o: any) => sum + (countMap.get(`${q.id}-${o.id}`) ?? 0), 0);
    return {
      id: q.id,
      question: q.question ?? "",
      totalResponses,
      options: qOptions.map((o: any) => {
        const count = countMap.get(`${q.id}-${o.id}`) ?? 0;
        return {
          id: o.id,
          text: o.option_text ?? "",
          count,
          percent: totalResponses > 0 ? Math.round((count / totalResponses) * 1000) / 10 : 0,
        };
      }),
    };
  });
}
