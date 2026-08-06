import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  theme?: "dark" | "light";
  className?: string;
}

function getPageList(current: number, total: number): (number | "…")[] {
  const delta = 1;
  const range: (number | "…")[] = [1];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  if (left > 2) range.push("…");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("…");
  if (total > 1) range.push(total);

  return range;
}

const THEME = {
  dark: {
    arrow: "border-white/10 text-zinc-300 hover:border-brand-pink hover:text-brand-pink",
    arrowDisabled: "pointer-events-none border-white/5 text-zinc-700",
    page: "text-zinc-300 hover:bg-white/10",
    pageActive: "bg-brand-pink text-white",
    ellipsis: "text-zinc-600",
  },
  light: {
    arrow: "border-indigo-950/15 text-indigo-950/70 hover:border-fuchsia-600 hover:text-fuchsia-700",
    arrowDisabled: "pointer-events-none border-indigo-950/5 text-indigo-950/20",
    page: "text-indigo-950/70 hover:bg-indigo-950/5",
    pageActive: "bg-indigo-950 text-white",
    ellipsis: "text-indigo-950/30",
  },
} as const;

/** Simple link-based pagination (no client JS needed) — pages navigate via `?page=n` so results
 * stay server-rendered and shareable/bookmarkable. */
export function Pagination({ currentPage, totalPages, buildHref, theme = "dark", className = "" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const t = THEME[theme];
  const pages = getPageList(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className={`mt-12 flex items-center justify-center gap-1.5 ${className}`}>
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
          currentPage === 1 ? t.arrowDisabled : t.arrow
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className={`px-1.5 text-sm font-bold ${t.ellipsis}`}>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
              p === currentPage ? t.pageActive : t.page
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
          currentPage === totalPages ? t.arrowDisabled : t.arrow
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
