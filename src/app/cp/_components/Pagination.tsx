import Link from "next/link";

/**
 * Shared pagination control for every CP list page (Users, Events, Menu Manager, Member Menu
 * Manager, ...). Renders Prev / a condensed page-number window with "..." gaps / Next, instead
 * of one button per page — with large tables (Events currently has 28+ pages) rendering every
 * page number wrapped across multiple lines and pushed the page layout wider than the viewport.
 */

function buildHref(basePath: string, query: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

/** Returns e.g. [1, "...", 4, 5, 6, "...", 28] — always keeps first, last, and a small window around current. */
function getPageWindow(current: number, total: number): (number | "gap")[] {
  const delta = 1;
  const middle: number[] = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    middle.push(i);
  }

  const pages: (number | "gap")[] = [1];
  if (middle.length && middle[0] > 2) pages.push("gap");
  pages.push(...middle);
  if (middle.length && middle[middle.length - 1] < total - 1) pages.push("gap");
  if (total > 1) pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  query = {},
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const activeClass = "rounded-lg bg-brand-pink px-3 py-1.5 text-xs font-bold text-white";
  const idleClass = "rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white";
  const disabledClass = "pointer-events-none rounded-lg border border-white/5 px-3 py-1.5 text-xs text-zinc-700";

  const pages = getPageWindow(currentPage, totalPages);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Link href={buildHref(basePath, query, Math.max(1, currentPage - 1))} className={isFirst ? disabledClass : idleClass}>
        &lsaquo; Prev
      </Link>

      {pages.map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-xs text-zinc-600">
            &hellip;
          </span>
        ) : (
          <Link key={p} href={buildHref(basePath, query, p)} className={p === currentPage ? activeClass : idleClass}>
            {p}
          </Link>
        )
      )}

      <Link href={buildHref(basePath, query, Math.min(totalPages, currentPage + 1))} className={isLast ? disabledClass : idleClass}>
        Next &rsaquo;
      </Link>
    </div>
  );
}
