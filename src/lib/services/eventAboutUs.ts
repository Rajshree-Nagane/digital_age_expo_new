import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * find_event_about_show is a single shared "extra fields" table (custom_<field_id> columns)
 * that many unrelated legacy tabs write into — not just About Show. Most of these columns are
 * NOT NULL with no DB default, so creating the row for the first time means every column needs
 * *some* value even though only a handful belong to this tab. These lists are transcribed
 * directly from prisma/schema.prisma's find_event_about_show model; keep them in sync if that
 * model ever changes.
 */
const LONG_TEXT_REQUIRED_IDS = [
  417, 418, 419, 420, 422, 423, 424,
  ...range(429, 483),
  501, 503, ...range(505, 510), ...range(512, 515), ...range(517, 523),
  282, 283, 833, 1556,
];
const SHORT_TEXT_REQUIRED_IDS = [284, 285, 286, 287, 288, 289, 1415, 1416, 1417, 1418, 1419, 1420];
const SHORT_TEXT_DEFAULTED_IDS = [...range(484, 498), 502, 504, 511, 516];

export const ABOUT_SHOW_VALID_FIELD_IDS = new Set([
  ...LONG_TEXT_REQUIRED_IDS,
  ...SHORT_TEXT_REQUIRED_IDS,
  ...SHORT_TEXT_DEFAULTED_IDS,
]);
const ALL_VALID_IDS = ABOUT_SHOW_VALID_FIELD_IDS;
const LONG_TEXT_IDS = new Set(LONG_TEXT_REQUIRED_IDS);

function buildRequiredDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const id of [...LONG_TEXT_REQUIRED_IDS, ...SHORT_TEXT_REQUIRED_IDS]) {
    defaults[`custom_${id}`] = "";
  }
  return defaults;
}

export interface AboutUsField {
  fieldId: number;
  column: string;
  label: string;
  description: string | null;
  isLongText: boolean;
  required: boolean;
  value: string;
}

export interface AboutUsForm {
  tabName: string;
  fields: AboutUsField[];
}

/** Mirrors members/event_about_us.php — organiser-only content blocks for the "about_show" tab. */
export async function getAboutUsForm(context: EventMemberContext): Promise<AboutUsForm> {
  const [tab, group] = await Promise.all([
    prisma.find_event_tab_menu.findFirst({ where: { name: "about_show" }, select: { tab_name: true } }),
    prisma.find_fields_groups.findFirst({ where: { type: "about_show" }, select: { id: true } }),
  ]);

  const fieldDefs = group
    ? await prisma.find_fields.findMany({
        where: { group_id: group.id },
        orderBy: { ordering: "asc" },
        select: { id: true, name: true, description: true, required: true },
      })
    : [];

  const relevantDefs = fieldDefs.filter((f: any) => ALL_VALID_IDS.has(f.id));
  if (relevantDefs.length === 0) {
    return { tabName: tab?.tab_name ?? "About Show", fields: [] };
  }

  const selectShape: Record<string, boolean> = {};
  for (const f of relevantDefs) selectShape[`custom_${f.id}`] = true;

  const existing = await prisma.find_event_about_show.findFirst({
    where: { event_id: context.eventId },
    select: selectShape as any,
  });

  const fields: AboutUsField[] = relevantDefs.map((f: any) => {
    const column = `custom_${f.id}`;
    return {
      fieldId: f.id,
      column,
      label: f.name,
      description: f.description,
      isLongText: LONG_TEXT_IDS.has(f.id),
      required: !!f.required,
      value: (existing as any)?.[column] ?? "",
    };
  });

  return { tabName: tab?.tab_name ?? "About Show", fields };
}

/** Mirrors event_about_us.php's insert/update branch. `values` is keyed by field id. */
export async function upsertAboutUs(
  context: EventMemberContext,
  values: Record<string, string>
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (context.role !== "organiser") {
    return { ok: false, error: "Only the event organiser can edit About Show." };
  }

  const data: Record<string, string> = {};
  for (const [fieldId, value] of Object.entries(values)) {
    const id = Number(fieldId);
    if (!ALL_VALID_IDS.has(id)) continue;
    data[`custom_${id}`] = value ?? "";
  }

  const existing = await prisma.find_event_about_show.findFirst({
    where: { event_id: context.eventId },
    select: { id: true },
  });

  if (existing) {
    await prisma.find_event_about_show.update({ where: { id: existing.id }, data: data as any });
  } else {
    await prisma.find_event_about_show.create({
      data: {
        event_id: context.eventId,
        user_id: context.userId,
        ...buildRequiredDefaults(),
        ...data,
      } as any,
    });
  }

  return { ok: true };
}
