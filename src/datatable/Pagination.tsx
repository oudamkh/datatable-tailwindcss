import { ReactNode } from "react";
import { DataTableClasses, PaginationState } from "./datatable.type";
import { cx } from "./datatable.helper";

type PaginationProps = {
  children: ReactNode;
  classes: DataTableClasses;
  totalRows: number;
  paging: PaginationState;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
}

export default function Pagination({
  children,
  classes,
  totalRows,
  paging,
  pageSizeOptions = [5, 10, 20, 50, 100],
  onPageChange,
}: PaginationProps) {
  return (
        <div
          className={cx(
            "flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600",
            classes.pagination
          )}
        >
          {/* Info */}
          <div className="flex items-center gap-2">
            <span>
              {totalRows === 0
                ? "No records"
                : `Showing ${Math.min((paging.page - 1) * paging.pageSize + 1, totalRows)}–${Math.min(
                    paging.page * paging.pageSize,
                    totalRows
                  )} of ${totalRows}`}
            </span>
            {/* Page size selector */}
            <select
              value={paging.pageSize}
              onChange={(e) => onPageChange(Number(e.target.value))}
              className="ml-2 px-2 py-1 rounded-lg border border-slate-200 bg-white
                text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <PaginationButton onClick={() => onPageChange(1)} disabled={paging.page === 1} label="First">
              «
            </PaginationButton>
            <PaginationButton onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page === 1} label="Previous">
              ‹
            </PaginationButton>

            {/* Page numbers */}
            {generatePageNumbers(pagination.page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1 text-slate-400 select-none">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p as number)}
                  className={cx(
                    "min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    p === pagination.page
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {p}
                </button>
              )
            )}

            <PaginationButton onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page >= totalPages} label="Next">
              ›
            </PaginationButton>
            <PaginationButton onClick={() => goToPage(totalPages)} disabled={pagination.page >= totalPages} label="Last">
              »
            </PaginationButton>
          </div>
        </div>
      );
}