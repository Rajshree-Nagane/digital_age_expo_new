/**
 * ===========================================================================
 *  SEARCH PARAM PARSING
 * ===========================================================================
 *
 *  Reading a numeric query parameter is not as simple as `Number(params.x)`,
 *  and getting it wrong took the member area down.
 *
 *  `find_event_menus.link` still holds legacy PHP template strings, 14 of which
 *  contain a literal `$id` placeholder that nothing substituted. The navbar then
 *  appended its own parameter, so links arrived as
 *
 *      ?action=view_my_booth&event_id=$id&event_id=1474
 *
 *  A REPEATED query parameter reaches a Server Component as an array, and
 *  `Number(["$id", "1474"])` is NaN. Every one of the 28 member pages wrote
 *
 *      resolvedParams.event_id ? Number(resolvedParams.event_id) : fallback
 *
 *  which is truthy for both an array and the string "$id", so all of them passed
 *  NaN into a Prisma query and rendered "Something went wrong".
 *
 *  The placeholder itself is fixed at source (see withEventId in
 *  EventAdminNavbar), but bookmarks, emails and browser history still hold the
 *  broken URLs — so parsing has to tolerate them rather than fail.
 */

/**
 * The first value of a query parameter that actually parses as a finite number,
 * or `fallback` when none does.
 *
 * Handles `string`, `string[]` (repeated parameter) and `undefined`. Scanning for
 * the first *usable* value rather than taking a fixed position is what makes
 * `?event_id=$id&event_id=1474` resolve to 1474 instead of NaN.
 */
export function numericParam(
  value: string | string[] | undefined,
  fallback: number
): number {
  const candidates = value === undefined ? [] : Array.isArray(value) ? value : [value];

  for (const candidate of candidates) {
    const trimmed = String(candidate).trim();
    if (!trimmed) continue;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

/**
 * As {@link numericParam} but with no fallback — `undefined` when the parameter
 * is absent or unusable, for the callers that treat "not supplied" as a distinct
 * case rather than defaulting.
 */
export function optionalNumericParam(
  value: string | string[] | undefined
): number | undefined {
  const result = numericParam(value, Number.NaN);
  return Number.isFinite(result) ? result : undefined;
}
