"use server";

import { revalidatePath } from "next/cache";
import { CACHE_TAGS, revalidateContent } from "@/lib/cache";
import { redirect } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { updateEventCore, setEventStatus, duplicateEvent, setActiveEventId } from "@/lib/cp/events/eventsRepository";
import { eventCopySchema } from "@/lib/validations/eventCopy";

/**
 * A blank <input type="date"> submits an empty string, and `new Date("")` is an "Invalid Date"
 * — not null, not undefined, just a Date object whose internals are NaN. Prisma doesn't reject
 * that at the call site; it blows up later, deep in its own query serializer, when it tries to
 * call .toISOString() on it (`RangeError: Invalid time value`). Parsing here and handing
 * eventsRepository a real `null` instead is what avoids ever constructing that Invalid Date.
 */
function parseOptionalDate(value: FormDataEntryValue | null): Date | null {
  const str = value ? String(value).trim() : "";
  if (!str) return null;
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function updateEventAction(eventId: number, formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.EVENTS_EDIT);

  await updateEventCore(eventId, {
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    friendly_url: String(formData.get("friendly_url") ?? ""),
    description_short: String(formData.get("description_short") ?? ""),
    description: String(formData.get("description") ?? ""),
    venue: String(formData.get("venue") ?? ""),
    location: String(formData.get("location") ?? ""),
    date_start: parseOptionalDate(formData.get("date_start")),
    date_end: parseOptionalDate(formData.get("date_end")),
    contact_name: String(formData.get("contact_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    website: String(formData.get("website") ?? ""),
  });

  revalidatePath("/cp/events");
  revalidatePath(`/cp/events/${eventId}`);
  // revalidatePath only busts rendered routes; the public site also reads this event through
  // cachedRead() in src/lib/services/events.ts, which is keyed by tag. See src/lib/cache.ts.
  revalidateContent(CACHE_TAGS.event);
}

export async function setEventStatusAction(eventId: number, formData: FormData): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.EVENTS_EDIT);
  await setEventStatus(eventId, String(formData.get("status") ?? ""));
  revalidatePath("/cp/events");
  revalidatePath(`/cp/events/${eventId}`);
  revalidateContent(CACHE_TAGS.event);
}

export async function duplicateEventAction(
  sourceEventId: number,
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  await requireCpPermission(CP_PERMISSIONS.EVENTS_EDIT);

  const parsed = eventCopySchema.safeParse({
    title: formData.get("title"),
    friendly_url: formData.get("friendly_url"),
    date_start: formData.get("date_start"),
    date_end: formData.get("date_end"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the highlighted fields." };
  }

  const newEvent = await duplicateEvent(sourceEventId, {
    title: parsed.data.title,
    friendly_url: parsed.data.friendly_url,
    date_start: new Date(parsed.data.date_start),
    date_end: new Date(parsed.data.date_end),
  });

  revalidatePath("/cp/events");
  revalidateContent(CACHE_TAGS.event);
  redirect(`/cp/events/${newEvent.id}`);
}

export async function setActiveEventAction(eventId: number): Promise<void> {
  await requireCpPermission(CP_PERMISSIONS.EVENTS_EDIT);
  await setActiveEventId(eventId);
  revalidatePath("/cp/events");
  revalidatePath(`/cp/events/${eventId}`);
  // This setting drives getDomain() (src/lib/services/domain.ts) for the ENTIRE public/member
  // site, not just these two CP pages — "layout" busts the root layout's whole subtree so a
  // production build (which statically caches pages that don't opt out) picks up the new
  // active event immediately instead of waiting for its own natural revalidation.
  revalidatePath("/", "layout");
  // ...and the tag-keyed entries behind getDomain(), which caches BOTH the active-event setting
  // and the find_domains row. Without this the whole site would keep serving the previous
  // active event until the revalidate window expired, making "Mark Active" look like a no-op.
  revalidateContent(CACHE_TAGS.domain, CACHE_TAGS.event);
}
