"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
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

/** Client-side pagination for admin tables/grids that already receive their full row set as
 * props and filter/search over it locally — just slice the filtered array with this page's
 * offset before rendering rows. Keeps state in the parent so search/filter changes can reset it. */
export function TablePagination({ currentPage, totalItems, pageSize, onPageChange, className = "" }: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const pages = getPageList(currentPage, totalPages);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className={`flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row ${className}`}>
      <p className="text-xs font-semibold text-zinc-500">
        Showing <span className="text-zinc-300">{start}</span>–<span className="text-zinc-300">{end}</span> of{" "}
        <span className="text-zinc-300">{totalItems}</span>
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-300 transition hover:border-indigo-500 hover:text-indigo-400 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-sm font-bold text-zinc-600">
              …
            </span>
          ) : (
            <button
              type="button"
              key={p}
              onClick={() => onPageChange(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                p === currentPage ? "bg-indigo-600 text-white" : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-300 transition hover:border-indigo-500 hover:text-indigo-400 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
