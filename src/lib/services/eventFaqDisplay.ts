import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import { ABOUT_SHOW_VALID_FIELD_IDS } from "@/lib/services/eventAboutUs";
import { FAQ_HARDCODE_ANSWERS } from "@/lib/constants/faqHardcodeAnswers";
import { FAQ_PERMISSION_FIELDS, type FaqPermissionField } from "@/lib/validations/eventFaq";

export interface EventFaqItem {
  fieldKey: string;
  question: string;
  answer: string;
  /** Whether this FAQ is currently visible to non-organisers (exhibitors etc). Missing
   * find_event_faqs_permission row means every FAQ defaults to published, mirroring the legacy
   * "noPermission" default-open behaviour. */
  published: boolean;
}

export interface EventFaqData {
  items: EventFaqItem[];
  /** Organisers get the "Mark to Publish / Mark to Not Publish" toggle on every FAQ; everyone
   * else only ever sees the already-published subset. */
  canManage: boolean;
}

/** Human-readable fallback question text, only used if find_fields is somehow missing a row
 * for one of the known FAQ field_keys (shouldn't normally happen, but keeps the page useful
 * rather than silently dropping a question). */
function titleCaseFieldKey(fieldKey: string): string {
  return fieldKey
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Mirrors members/event_faq.php — this page has no content of its own. It repurposes whichever
 * find_fields rows are tagged with one of the known FAQ field_keys (the same set of keys that
 * find_event_faqs_permission has real columns for — access, banking, toilet, parking, etc.),
 * pulling each answer from that same event's find_event_about_show row and falling back to the
 * legacy hardcoded boilerplate copy (HardCode_data()) when the event hasn't filled in its own
 * answer. Visibility to non-organisers is gated per field_key by find_event_faqs_permission's
 * matching boolean column (missing row = show all, matching the legacy "noPermission"
 * default-open behaviour).
 *
 * Earlier this scoped find_fields via find_fields_groups/group_id (mirroring how the "About
 * Show" editor tab looks its fields up), but the legacy event_faq.php actually scopes via a
 * completely different table (find_listing_setting.type='about_show' + find_fields.parent_id) —
 * and in practice neither linkage is needed here: field_key itself is the shared key the legacy
 * code correlates between find_fields, find_event_faqs_permission, and HardCode_data(), so
 * filtering find_fields directly by field_key against the known permission-column list is both
 * simpler and independent of how any particular database happens to have parent_id/group_id set.
 */
export async function getEventFaqs(context: EventMemberContext): Promise<EventFaqData> {
  const fieldDefs = await prisma.find_fields.findMany({
    where: { field_key: { in: [...FAQ_PERMISSION_FIELDS] } },
    select: { id: true, name: true, field_key: true },
  });

  const byFieldKey = new Map(fieldDefs.map((f: any) => [f.field_key as string, f]));

  // Only field ids that actually have a matching custom_<id> column on find_event_about_show
  // can be selected there — everything else just always uses the hardcoded fallback answer.
  const overridableDefs = fieldDefs.filter((f: any) => ABOUT_SHOW_VALID_FIELD_IDS.has(f.id));
  const selectShape: Record<string, boolean> = {};
  for (const f of overridableDefs) selectShape[`custom_${f.id}`] = true;

  const [existing, permission] = await Promise.all([
    Object.keys(selectShape).length > 0
      ? prisma.find_event_about_show.findFirst({ where: { event_id: context.eventId }, select: selectShape as any })
      : Promise.resolve(null),
    prisma.find_event_faqs_permission.findFirst({ where: { event_id: context.eventId } }),
  ]);

  const items: EventFaqItem[] = FAQ_PERMISSION_FIELDS.map((fieldKey) => {
    const f = byFieldKey.get(fieldKey) as { id: number; name: string; field_key: string | null } | undefined;
    const raw = f ? (existing as any)?.[`custom_${f.id}`] : undefined;
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    const answer = trimmed.length > 0 ? trimmed : (FAQ_HARDCODE_ANSWERS[fieldKey] ?? "");
    const published = permission ? (permission as any)[fieldKey] !== false : true;
    const question = f?.name || titleCaseFieldKey(fieldKey);
    return { fieldKey, question, answer, published };
  });

  if (context.role === "organiser") {
    return { items, canManage: true };
  }

  return { items: items.filter((item) => item.published && item.answer.length > 0), canManage: false };
}

/** Mirrors ajax.php's action=set_permission — organiser-only toggle of a single FAQ's
 * visibility. Unlike the legacy handler (which interpolated the posted column name directly
 * into raw SQL), field_key is validated against FAQ_PERMISSION_FIELDS before ever reaching a
 * query. Keyed by event_id only, matching what event_faq.php actually reads back. */
export async function setFaqPermission(
  context: EventMemberContext,
  fieldKey: FaqPermissionField,
  published: boolean
) {
  if (context.role !== "organiser") {
    return { ok: false as const, error: "Only organisers can manage FAQ visibility." };
  }
  if (!FAQ_PERMISSION_FIELDS.includes(fieldKey)) {
    return { ok: false as const, error: "Unrecognised FAQ field." };
  }

  const existing = await prisma.find_event_faqs_permission.findFirst({
    where: { event_id: context.eventId },
    select: { id: true },
  });

  if (existing) {
    await prisma.find_event_faqs_permission.update({
      where: { id: existing.id },
      data: { [fieldKey]: published } as any,
    });
  } else {
    await prisma.find_event_faqs_permission.create({
      data: { event_id: context.eventId, user_id: context.userId, [fieldKey]: published } as any,
    });
  }

  return { ok: true as const, published };
}
