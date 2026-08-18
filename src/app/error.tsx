"use client";

import { useEffect } from "react";
import { getDatabaseOutage } from "@/lib/db-errors";
import { DatabaseOutageNotice } from "@/components/common/DatabaseOutageNotice";

/**
 * Route-level error boundary — the safety net for pages whose data loaders still let an exception
 * escape (only the home page's loader is individually guarded so far).
 *
 * Without this, any uncaught server-component error replaces the entire site with Next's default
 * error screen (a raw stack trace in dev). With it, a database outage is explained in the site's
 * own styling, and anything else at least gets a retry affordance instead of a wall of
 * generated-client stack frames.
 *
 * Note: in production Next redacts server error messages before they reach the client, so the
 * database-outage branch below reliably matches only in development. That is fine — the real fix
 * for production is to guard the loader (see src/lib/db-errors.ts `safeQuery`), and this boundary
 * exists so nothing ever renders a stack trace to a visitor.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  const outage = getDatabaseOutage(error);
  if (outage) {
    return <DatabaseOutageNotice outage={outage} />;
  }

  return (
    <main className="min-h-screen bg-surface-1">
      <div className="mx-auto max-w-2xl px-6 py-32 text-center text-white">
        <h1 className="text-3xl font-bold">Something went wrong</h1>

        <p className="mt-4 text-white/70">
          This page couldn&apos;t be loaded. Try again in a moment.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Try again
        </button>

        {process.env.NODE_ENV !== "production" && (
          <pre className="mt-8 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 text-left font-mono text-xs text-white/60">
            {error.message}
          </pre>
        )}

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-white/40">ref: {error.digest}</p>
        )}
      </div>
    </main>
  );
}
