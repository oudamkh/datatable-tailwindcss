"use client";

import { PaginationState } from "./datatable.types";

interface PaginationProps {
  pagination: PaginationState;
  totalRows: number;
  totalPages: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
  loading?: boolean;
}

export default function Pagination({
  pagination,
  totalRows,
  totalPages,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  className = "",
  loading,
}: PaginationProps) {
  const { page, pageSize } = pagination;
  const from = Math.min((page - 1) * pageSize + 1, totalRows);
  const to = Math.min(page * pageSize, totalRows);

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "…", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "…", page - 1, page, page + 1, "…", totalPages);
    }
    return pages;
  };

  const btnBase =
    "inline-flex items-center justify-center h-8 min-w-[2rem] px-2 text-sm rounded transition-all duration-150 font-medium select-none disabled:opacity-40 disabled:cursor-not-allowed";
  const btnDefault =
    "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300";
  const btnActive =
    "bg-indigo-600 border border-indigo-600 text-white shadow-sm shadow-indigo-200";

  return (
    <div
      className={[
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3",
        "border-t border-slate-200 bg-slate-50/60",
        className,
      ].join(" ")}
    >
      {/* Left: row info + page size selector */}
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className="hidden sm:inline">
          {totalRows === 0
            ? "No results"
            : `Showing ${from}–${to} of ${totalRows.toLocaleString()} rows`}
        </span>
        <span className="sm:hidden text-xs">
          {from}–{to} / {totalRows}
        </span>

        <div className="flex items-center gap-1.5">
          <label htmlFor="dt-page-size" className="text-xs text-slate-500">
            Rows
          </label>
          <select
            id="dt-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
            className="h-7 rounded border border-slate-200 bg-white px-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: page buttons */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          aria-label="Previous page"
          className={[btnBase, btnDefault].join(" ")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((p, idx) =>
          p === "…" ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={loading}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={[
                btnBase,
                p === page ? btnActive : btnDefault,
              ].join(" ")}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          aria-label="Next page"
          className={[btnBase, btnDefault].join(" ")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
