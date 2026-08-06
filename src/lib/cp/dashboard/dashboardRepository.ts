import { prisma } from "@/lib/prisma";

/**
 * Dynamic data source for the CP Dashboard (/cp). Every count and every breakdown here is a
 * live Prisma query against the real tables this app already reads/writes elsewhere in the CP
 * (see src/lib/cp/*Repository.ts for the sibling modules) — nothing on this page is hardcoded
 * or seeded demo data. Each metric is wrapped in safe() so one drifted/renamed column can't
 * take down the whole dashboard: it degrades to "unavailable" (null) for that one card instead
 * of throwing for the entire page.
 *
 * Status breakdowns for columns Prisma maps as a native enum (find_users.user_status,
 * find_event_exhibitor.status, find_speakers.status, find_event_sponsorer.status,
 * find_invoices.status) go through raw SQL instead of the typed groupBy()/findMany() APIs.
 * MySQL's native ENUM columns silently store an out-of-range INSERT as '' in non-strict SQL
 * mode (documented MySQL behavior, not a bug here) — this live database has exactly that: rows
 * whose status is '', which isn't one of the labels Prisma's generated enum type knows about.
 * groupBy() has to deserialize each group's key into that TS enum and throws
 * PrismaClientKnownRequestError ("Value '' not found in enum ...") the moment it hits one.
 * count() never deserializes the column at all, so plain totals are unaffected — only the
 * per-status breakdown needs to read the column as text. $queryRaw does exactly that, and is
 * safe to use with plain string SQL here because every table/column name below is a fixed
 * literal this file controls, never user input.
 */

export interface BreakdownSlice {
  label: string;
  value: number;
}

export interface DashboardMetric {
  total: number;
  breakdown: BreakdownSlice[];
}

/** "Not_Interested" -> "Not Interested", "active" -> "Active", "" / null -> "Not set". */
function humanize(raw: string | null | undefined): string {
  const spaced = (raw ?? "").replace(/_/g, " ").trim();
  if (!spaced) return "Not set";
  return spaced
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error("[cp dashboard] metric query failed:", err);
    return null;
  }
}

interface RawStatusRow {
  status_value: string | null;
  cnt: bigint | number;
}

/** Merges raw GROUP BY rows into humanized, de-duplicated slices (NULL and '' both collapse
 * into the same "Not set" bucket rather than showing as two separate slices). */
function mergeStatusRows(rows: RawStatusRow[]): BreakdownSlice[] {
  const byLabel = new Map<string, number>();
  for (const row of rows) {
    const label = humanize(row.status_value);
    byLabel.set(label, (byLabel.get(label) ?? 0) + Number(row.cnt));
  }
  return Array.from(byLabel, ([label, value]) => ({ label, value }));
}

async function usersMetric(): Promise<DashboardMetric | null> {
  return safe(async () => {
    const [total, rows] = await Promise.all([
      prisma.find_users.count(),
      prisma.$queryRaw<RawStatusRow[]>`
        SELECT user_status AS status_value, COUNT(*) AS cnt FROM find_users GROUP BY user_status
      `,
    ]);
    return { total, breakdown: mergeStatusRows(rows) };
  });
}

async function eventsMetric(): Promise<DashboardMetric | null> {
  return safe(async () => {
    const [total, groups] = await Promise.all([
      prisma.find_events.count(),
      prisma.find_events.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    return { total, breakdown: groups.map((g) => ({ label: humanize(g.status), value: g._count._all })) };
  });
}

async function emailTemplatesMetric(): Promise<DashboardMetric | null> {
  return safe(async () => {
    const [total, groups] = await Promise.all([
      prisma.find_email_templates.count(),
      prisma.find_email_templates.groupBy({ by: ["disable"], _count: { _all: true } }),
    ]);
    return { total, breakdown: groups.map((g) => ({ label: g.disable ? "Disabled" : "Enabled", value: g._count._all })) };
  });
}

async function exhibitorsMetric(): Promise<DashboardMetric | null> {
  return safe(async () => {
    const [total, rows] = await Promise.all([
      prisma.find_event_exhibitor.count(),
      prisma.$queryRaw<RawStatusRow[]>`
        SELECT status AS status_value, COUNT(*) AS cnt FROM find_event_exhibitor GROUP BY status
      `,
    ]);
    return { total, breakdown: mergeStatusRows(rows) };
  });
}

async function speakersMetric(): Promise<DashboardMetric | null> {
  return safe(async () => {
    const [total, rows] = await Promise.all([
      prisma.find_speakers.count(),
      prisma.$queryRaw<RawStatusRow[]>`
        SELECT status AS status_value, COUNT(*) AS cnt FROM find_speakers GROUP BY status
      `,
    ]);
    return { total, breakdown: mergeStatusRows(rows) };
  });
}

async function sponsorsMetric(): Promise<DashboardMetric | null> {
  return safe(async () => {
    const [total, rows] = await Promise.all([
      prisma.find_event_sponsorer.count(),
      prisma.$queryRaw<RawStatusRow[]>`
        SELECT status AS status_value, COUNT(*) AS cnt FROM find_event_sponsorer GROUP BY status
      `,
    ]);
    return { total, breakdown: mergeStatusRows(rows) };
  });
}

async function visitorsMetric(): Promise<DashboardMetric | null> {
  return safe(async () => {
    // Mirrors eventSummary.ts's own visitorCount query — find_events_rsvp, excluding
    // soft-deleted rows. Not scoped to a single event_id here: the CP dashboard's job is a
    // site-wide total, unlike the per-event member portal summary that reuses this table.
    // status is a plain VARCHAR on this table (not a Prisma enum), so the typed groupBy is
    // safe here — no out-of-range enum values to trip over.
    const where = { is_deleted: 0 };
    const [total, groups] = await Promise.all([
      prisma.find_events_rsvp.count({ where }),
      prisma.find_events_rsvp.groupBy({ by: ["status"], where, _count: { _all: true } }),
    ]);
    return { total, breakdown: groups.map((g) => ({ label: humanize(g.status), value: g._count._all })) };
  });
}

async function ordersMetric(): Promise<DashboardMetric | null> {
  return safe(async () => {
    const [total, groups] = await Promise.all([
      prisma.find_orders.count(),
      prisma.find_orders.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    return { total, breakdown: groups.map((g) => ({ label: humanize(g.status), value: g._count._all })) };
  });
}

async function invoicesMetric(): Promise<DashboardMetric | null> {
  return safe(async () => {
    const [total, rows] = await Promise.all([
      prisma.find_invoices.count(),
      prisma.$queryRaw<RawStatusRow[]>`
        SELECT status AS status_value, COUNT(*) AS cnt FROM find_invoices GROUP BY status
      `,
    ]);
    return { total, breakdown: mergeStatusRows(rows) };
  });
}

export interface DashboardData {
  users: DashboardMetric | null;
  events: DashboardMetric | null;
  emailTemplates: DashboardMetric | null;
  exhibitors: DashboardMetric | null;
  speakers: DashboardMetric | null;
  sponsors: DashboardMetric | null;
  visitors: DashboardMetric | null;
  orders: DashboardMetric | null;
  invoices: DashboardMetric | null;
  emailLogsTotal: number | null;
  letterLogsTotal: number | null;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [
    users,
    events,
    emailTemplates,
    exhibitors,
    speakers,
    sponsors,
    visitors,
    orders,
    invoices,
    emailLogsTotal,
    letterLogsTotal,
  ] = await Promise.all([
    usersMetric(),
    eventsMetric(),
    emailTemplatesMetric(),
    exhibitorsMetric(),
    speakersMetric(),
    sponsorsMetric(),
    visitorsMetric(),
    ordersMetric(),
    invoicesMetric(),
    safe(() => prisma.find_email_log.count()),
    safe(() => prisma.find_letter_log.count()),
  ]);

  return {
    users,
    events,
    emailTemplates,
    exhibitors,
    speakers,
    sponsors,
    visitors,
    orders,
    invoices,
    emailLogsTotal,
    letterLogsTotal,
  };
}
