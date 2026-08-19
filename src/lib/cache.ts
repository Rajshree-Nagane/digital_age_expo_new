/**
 * ===========================================================================
 *  CROSS-REQUEST READ CACHE FOR PUBLIC SITE CONTENT
 * ===========================================================================
 *
 *  WHY THIS EXISTS
 *
 *  Every public page rendered a fresh set of database queries on every single
 *  request. Nothing here was cached across requests: there was not one
 *  `unstable_cache`, `export const revalidate`, or `"use cache"` anywhere in
 *  the app, and 26 pages additionally opted into `force-dynamic`. The only
 *  caching present was React's `cache()` in a few services, which is
 *  request-scoped — it de-duplicates calls *within* one render and is thrown
 *  away the moment the response is sent.
 *
 *  With ~50 public routes and no crawler controls, one bot sweep of the site
 *  meant one full re-read of the legacy `find_*` tables. That is what burned
 *  through the database's monthly data-transfer allowance, after which the
 *  provider rejected EVERY query with SQLSTATE 53000 and most of the site
 *  returned 500. See src/lib/db-errors.ts for the containment side of that
 *  incident; this file is the prevention side.
 *
 *  WHAT TO CACHE HERE — AND WHAT NOT TO
 *
 *  Only *public, non-personalised* reads belong in this cache. A cache entry
 *  is shared by every visitor, so caching anything derived from a session,
 *  cookie, or member id would leak one user's data to another. Concretely:
 *
 *    YES  event details, speakers, sponsors, exhibitor directory, schedule,
 *         FAQs, magazine issues, ticket *types*, translated phrases, menus —
 *         the same bytes for everybody.
 *    NO   anything under /members or /cp, anything keyed on a logged-in user,
 *         ticket *purchases*, registrations, invoices, dashboards.
 *
 *  WHY `unstable_cache` AND NOT `use cache`
 *
 *  Next.js 16 supersedes `unstable_cache` with the `use cache` directive, but
 *  `use cache` requires turning on the `cacheComponents` flag, which changes
 *  rendering semantics for the whole application (uncached dynamic access has
 *  to move inside Suspense boundaries). Flipping that on a 100+ route legacy
 *  port while production is already down is not a change anyone can verify in
 *  one pass. `unstable_cache` gets the same egress reduction with a blast
 *  radius of exactly the functions wrapped here. Migrating to Cache
 *  Components later is a deliberate, separate piece of work.
 */

import { revalidateTag, unstable_cache, updateTag } from "next/cache";

/**
 * Cache tags, so a CP edit can invalidate precisely what it changed instead of
 * making an editor wait out the revalidate window.
 *
 * Keep these coarse — one tag per *kind of content* an editor thinks in terms
 * of. Per-row tags would multiply the number of `revalidateTag` calls every
 * write path has to remember to make, and forgetting one is a stale-content
 * bug that is very hard to spot.
 */
export const CACHE_TAGS = {
  /** find_domains row + the CP "active event" setting. Read on literally every request. */
  domain: "domain",
  /** find_events / find_events_dates — event name, dates, venue, friendly url. */
  event: "event",
  /** find_speakers and the speaker slot/agenda joins. */
  speakers: "speakers",
  /** find_event_sponsorer + sponsorship tiers. */
  sponsors: "sponsors",
  /** find_event_exhibitor, the public directory, stand packages, why-exhibit copy. */
  exhibitors: "exhibitors",
  /** find_event_schedules + agenda venues. */
  schedule: "schedule",
  /** find_listing_listing_faq. */
  faq: "faq",
  /** find_event_magazine_setup. */
  magazine: "magazine",
  /** find_event_ticket — ticket TYPES and their prices, not purchases. */
  tickets: "tickets",
  /** find_language_phrases — the translated UI strings. */
  phrases: "phrases",
  /** find_pages — the CMS pages served by the `[...slug]` catch-all. */
  pages: "pages",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/**
 * Default revalidate window, in seconds.
 *
 * Thirty minutes, and the number is chosen against how the database actually
 * bills. Prisma Postgres charges per *operation* — one Prisma query is one
 * operation regardless of how much work it does — and the Free plan includes
 * 100,000 per month.
 *
 * Caching changes the shape of that cost completely. Uncached, reads scale with
 * traffic: this app runs roughly 15-20 queries per page render, so 100,000
 * operations is about 6,000 page views, which one crawler sweep can eat. Cached,
 * reads scale with *time* instead — each distinct query costs at most one read
 * per window, no matter how many visitors arrive. So the window sets the bill:
 *
 *   ~35 distinct cached reads x (60 / minutes) x 720 hours
 *     5 min  -> ~300,000 operations/month   (over the Free allowance)
 *    30 min  ->  ~50,000 operations/month   (comfortably inside it)
 *
 * Thirty minutes is affordable here because it costs an editor nothing: every CP
 * write path calls `revalidateContent` (below), which expires the affected tag
 * immediately, so a save is visible on the next render. The window is only the
 * backstop for content changed outside the CP, or by a write path that forgot to
 * invalidate — and for that, half an hour of staleness on event marketing copy is
 * not a real problem.
 *
 * Raise it further if operations still run high; lower it only for content that
 * genuinely changes minute to minute, by passing `revalidate` per call.
 */
const DEFAULT_REVALIDATE_SECONDS = 1800;

/**
 * Escape hatch: set `DISABLE_READ_CACHE=1` to make every `cachedRead` wrapper a
 * pass-through. Intended for debugging a suspected stale-cache problem without
 * having to revert code — note that on a platform where env vars are baked in
 * at build time this still needs a redeploy to take effect.
 */
const CACHE_DISABLED = process.env.DISABLE_READ_CACHE === "1";

/**
 * Values that survive a round-trip through the cache.
 *
 * This matters more than it looks. `unstable_cache` serialises what it stores,
 * and several of these legacy tables have `Decimal` columns (54 of them across
 * the schema — prices, tax rates, latitude/longitude). Prisma hands those back
 * as `Decimal` *class instances*, which are not serialisable. The services in
 * this app happen to map them to strings in their row-mapper functions (see
 * `toRow` in src/lib/services/eventTickets.ts), so the DTOs they return are
 * safe — but that is a property of those mappers, not a guarantee, and the
 * failure mode if someone later caches a raw Prisma row is a confusing
 * serialisation error at runtime rather than a clear one at the call site.
 *
 * So in development we walk the value once and throw with the offending path.
 * Skipped in production: it is a development guardrail, not a runtime check,
 * and walking every cached payload on every miss would be its own waste.
 */
function assertSerializable(value: unknown, path = "value", depth = 0): void {
  if (depth > 12) return; // deep enough to catch real mistakes; guards against cycles
  if (value === null || value === undefined) return;

  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return;
  if (t === "bigint") {
    throw new Error(
      `[cache] ${path} is a BigInt, which cannot be cached. Convert it (String(x) or Number(x)) ` +
        `in the service's row mapper before returning.`
    );
  }
  if (t === "function" || t === "symbol") {
    throw new Error(`[cache] ${path} is a ${t}, which cannot be cached.`);
  }
  if (value instanceof Date) return; // round-trips correctly — see encodeDates/decodeDates below
  if (Array.isArray(value)) {
    // Sample rather than walk every row — a mis-typed column is uniform across a result set,
    // so the first few rows catch it, and long directory listings stay cheap to check.
    for (let i = 0; i < Math.min(value.length, 5); i++) {
      assertSerializable(value[i], `${path}[${i}]`, depth + 1);
    }
    return;
  }
  if (t === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      // Prisma's Decimal is the one we actually expect to hit here.
      const name = (value as object).constructor?.name ?? "unknown";
      if (name === "Decimal") {
        throw new Error(
          `[cache] ${path} is a Prisma Decimal, which cannot be cached. Map it to a string or ` +
            `number in the service's row mapper (see toRow() in services/eventTickets.ts) before ` +
            `returning it from a cachedRead-wrapped function.`
        );
      }
      throw new Error(
        `[cache] ${path} is a ${name} instance, which cannot be cached. Return a plain object.`
      );
    }
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      assertSerializable(v, `${path}.${k}`, depth + 1);
    }
  }
}

/**
 * ---------------------------------------------------------------------------
 *  Date round-tripping
 * ---------------------------------------------------------------------------
 *
 *  `unstable_cache` persists entries as JSON, and JSON has no Date type. So a
 *  `Date` written into the cache comes back out as an ISO **string** — silently,
 *  and only on a cache hit, which makes it a genuinely nasty bug: the first
 *  request after a deploy works, and every subsequent one crashes.
 *
 *  This bit us immediately. `getEventById` returns `date_start`/`date_end` as
 *  Dates, and `HeroSection` calls `formatDateLocation(dateStart, ...)`, which
 *  does `dateStart.getDate()`. With the raw cache in place the home page threw
 *  `TypeError: dateStart.getDate is not a function` on the second render.
 *
 *  Rather than push string-vs-Date handling out into every consumer (dozens of
 *  components, all of which currently and reasonably assume a Date), the cache
 *  encodes Dates with a sentinel on the way in and rebuilds them on the way out.
 *  Both halves live here, so callers get back exactly the shape their reader
 *  returned and nothing outside this file has to know the cache exists.
 *
 *  The sentinel key is deliberately obscure and the decoder only treats an
 *  object as an encoded Date when that key is its *only* property, so a real
 *  data object can't be mistaken for one.
 */
const DATE_SENTINEL = "__cachedDate__";

function encodeDates(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return { [DATE_SENTINEL]: value.toISOString() };
  if (Array.isArray(value)) return value.map(encodeDates);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = encodeDates(v);
  return out;
}

function decodeDates(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(decodeDates);
  const obj = value as Record<string, unknown>;
  const iso = obj[DATE_SENTINEL];
  if (typeof iso === "string" && Object.keys(obj).length === 1) return new Date(iso);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = decodeDates(v);
  return out;
}

/**
 * Wraps a public read so its result is reused across requests.
 *
 * The returned function has the same signature as the one passed in, and its
 * arguments become part of the cache key — so `getCachedEventById(1474)` and
 * `getCachedEventById(9)` are separate entries, as you would expect.
 *
 * @param keyParts stable, unique prefix for this function. MUST be unique per
 *   wrapped function: two functions sharing a prefix would serve each other's
 *   results. Convention here is `["service", "fnName"]`.
 * @param run the read to cache. Must return plain, serialisable data — DTOs, not
 *   raw Prisma rows (see `assertSerializable`).
 * @param options.tags which `CACHE_TAGS` invalidate this entry.
 * @param options.revalidate seconds before the entry is refreshed; defaults to
 *   five minutes.
 */
export function cachedRead<Args extends unknown[], T>(
  keyParts: string[],
  run: (...args: Args) => Promise<T>,
  options: { tags: CacheTag[]; revalidate?: number }
): (...args: Args) => Promise<T> {
  if (CACHE_DISABLED) return run;

  const guarded =
    process.env.NODE_ENV === "production"
      ? run
      : (async (...args: Args) => {
          const result = await run(...args);
          assertSerializable(result, `${keyParts.join(".")}()`);
          return result;
        });

  // Encode inside the cached scope so what gets persisted is already JSON-safe; decode outside it
  // so both a cache hit and a cache miss come back through the same path and callers always get
  // real Dates back.
  const cached = unstable_cache(
    async (...args: Args) => encodeDates(await guarded(...args)),
    keyParts,
    {
      tags: options.tags,
      revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS,
    }
  );

  return async (...args: Args) => decodeDates(await cached(...args)) as T;
}

/**
 * Invalidates cached public content after a CP edit, from inside a Server Action.
 *
 * The CP's server actions already call `revalidatePath` to refresh the rendered routes they
 * affect, but that does nothing to the entries created by `cachedRead` — those are keyed by tag,
 * so they need this as well. Call it from any action that changes content the public site reads,
 * passing the tags for what actually changed:
 *
 *     revalidateContent(CACHE_TAGS.speakers)
 *     revalidateContent(CACHE_TAGS.event, CACHE_TAGS.schedule)
 *
 * Uses `updateTag`, not `revalidateTag`, because this is the read-your-own-writes case: an editor
 * who just pressed Save must see their change on the very next render. `revalidateTag(tag, "max")`
 * would instead serve them the stale copy once while refreshing in the background, which reads as
 * "my save didn't work".
 *
 * Server Actions only — `updateTag` throws anywhere else. Route handlers want
 * `markContentStale` below.
 *
 * Over-invalidating is cheap (one extra read); under-invalidating shows an editor stale content
 * and looks like their save silently failed, so when in doubt list the extra tag.
 */
export function revalidateContent(...tags: CacheTag[]): void {
  for (const tag of tags) updateTag(tag);
}

/**
 * Marks cached public content stale from a context that is not a Server Action — a route handler
 * under src/app/api, a webhook, a cron job.
 *
 * `profile: "max"` gives stale-while-revalidate: the next visitor is served the existing copy
 * while a fresh one is fetched behind them. That is the right trade for a background writer (no
 * one is sitting there waiting to see the result) and it avoids a thundering herd of blocking
 * revalidations if a bulk import touches the same tag repeatedly.
 */
export function markContentStale(...tags: CacheTag[]): void {
  for (const tag of tags) revalidateTag(tag, "max");
}

