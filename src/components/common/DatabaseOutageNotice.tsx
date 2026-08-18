import type { DatabaseOutage } from "@/lib/db-errors";

/**
 * Shown instead of (or above) page content when the database is refusing to serve queries.
 *
 * Two variants:
 *  - `page`   — the route has no usable data at all, so this replaces the page body.
 *  - `banner` — some data loaded; warn that the page is incomplete but still render it.
 *
 * The raw driver message is only rendered outside production: it is useful while developing and
 * meaningless (and potentially revealing) to a real visitor.
 */
export function DatabaseOutageNotice({
  outage,
  variant = "page",
}: {
  outage: DatabaseOutage;
  variant?: "page" | "banner";
}) {
  const isDev = process.env.NODE_ENV !== "production";

  if (variant === "banner") {
    return (
      <div
        role="status"
        className="border-b border-amber-400/30 bg-amber-400/10 px-6 py-3 text-sm text-amber-100"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-1">
          <p className="font-semibold">
            {outage.title} — parts of this page could not be loaded.
          </p>
          <p className="text-amber-100/80">{outage.detail}</p>
          {isDev && outage.raw && (
            <p className="mt-1 font-mono text-xs text-amber-200/70">
              {outage.code ? `[${outage.code}] ` : ""}
              {outage.raw}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface-1">
      <div className="mx-auto max-w-2xl px-6 py-32 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-300">
          Temporarily unavailable
        </p>

        <h1 className="mt-4 text-3xl font-bold">{outage.title}</h1>

        <p className="mt-4 text-white/70">{outage.detail}</p>

        <p className="mt-8 text-sm text-white/50">
          Nothing has been lost — this page will load normally again as soon as the database is
          accepting queries.
        </p>

        {isDev && outage.raw && (
          <pre className="mt-8 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 text-left font-mono text-xs text-white/60">
            {outage.code ? `[${outage.code}] ` : ""}
            {outage.raw}
          </pre>
        )}
      </div>
    </main>
  );
}
