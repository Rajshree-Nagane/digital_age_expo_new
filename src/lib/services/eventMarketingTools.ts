import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventMarketingToolsInput } from "@/lib/validations/eventMarketingTools";

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * find_event_about_show is a single shared "extra fields" table (custom_<field_id> columns)
 * that several unrelated members tabs write into (About Show, Show Info, Marketing Tools, ...).
 * Most columns are NOT NULL with no DB default, so whichever tab creates this event's row first
 * needs *some* value for every column, not just the ones it owns. Transcribed directly from
 * prisma/schema.prisma's find_event_about_show model — keep in sync if that model ever changes.
 */
const LONG_TEXT_REQUIRED_IDS = [
  417, 418, 419, 420, 422, 423, 424,
  ...range(429, 483),
  501, 503, ...range(505, 510), ...range(512, 515), ...range(517, 523),
  282, 283, 833, 1556,
];
const SHORT_TEXT_REQUIRED_IDS = [284, 285, 286, 287, 288, 289, 1415, 1416, 1417, 1418, 1419, 1420];

function buildRequiredDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const id of [...LONG_TEXT_REQUIRED_IDS, ...SHORT_TEXT_REQUIRED_IDS]) {
    defaults[`custom_${id}`] = "";
  }
  return defaults;
}

/** Mirrors the fixed custom_<id> columns members/event_marketing_tools.php / its .tpl read and display. */
const FIELD_COLUMN = {
  cover_image: "custom_482",
  medium_banner_1: "custom_484",
  medium_banner_2: "custom_485",
  medium_banner_3: "custom_486",
  large_banner_1: "custom_487",
  large_banner_2: "custom_488",
  large_banner_3: "custom_489",
  large_square: "custom_490",
  guest_invitation: "custom_492",
  email_template: "custom_493",
  editorial_100: "custom_494",
  editorial_200: "custom_495",
  startup_editorial_100: "custom_496",
  startup_editorial_200: "custom_497",
  show_logo: "custom_498",
} as const satisfies Record<keyof EventMarketingToolsInput, string>;

export type MarketingToolsData = Record<keyof EventMarketingToolsInput, string>;

const SELECT_FIELDS = Object.fromEntries(Object.values(FIELD_COLUMN).map((c) => [c, true]));

/** Mirrors members/event_marketing_tools.php — a shared set of downloadable marketing assets for this event. */
export async function getMarketingTools(context: EventMemberContext): Promise<MarketingToolsData> {
  const row = await prisma.find_event_about_show.findFirst({
    where: { event_id: context.eventId },
    select: SELECT_FIELDS as any,
  });

  const data = {} as MarketingToolsData;
  for (const key of Object.keys(FIELD_COLUMN) as (keyof EventMarketingToolsInput)[]) {
    data[key] = (row as any)?.[FIELD_COLUMN[key]] ?? "";
  }
  return data;
}

/** Mirrors event_marketing_tools.php's upload/edit branch (organiser-only — the legacy page itself
 * is read-only display, but every other tab on this shared table lets the organiser edit its own
 * fields the same way, so we extend that same pattern here). */
export async function updateMarketingTools(
  context: EventMemberContext,
  input: EventMarketingToolsInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (context.role !== "organiser") {
    return { ok: false, error: "Only the event organiser can update marketing tools." };
  }

  const data: Record<string, string> = {};
  for (const key of Object.keys(FIELD_COLUMN) as (keyof EventMarketingToolsInput)[]) {
    data[FIELD_COLUMN[key]] = input[key] ?? "";
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
