import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
  ChangeEvent,
} from "react";
import { DataTableProps, SortState, PaginationState } from "./datatable.type";
import SortIcon from "./SortIcon";
import Checkbox from "./Checkbox";
import PaginationButton from "./Pagination";
import { clientFilter, clientSort, getNestedValue, exportToCSV, exportToExcel } from "./datatable.helper";

export function DataTable<T = Record<string, unknown>>({
  columns: columnsProp,
  data,
  fetchData,
  selectable = false,
  onSelectionChange,
  searchable = false,
  externalFilters = {},
  paginated = true,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  showSummary = false,
  columnToggle = false,
  exportable = false,
  caption,
  classes = {},
  loadingText = "Loading…",
  emptyText = "No records found.",
  rowKey,
}: DataTableProps<T>) {
  // ── Column visibility ─────────────────────────────────────────────────────
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columnsProp.map((c) => [c.key, c.visible !== false]))
  );
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setShowColMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const columns = useMemo(
    () => columnsProp.filter((c) => visibility[c.key] !== false),
    [columnsProp, visibility]
  );

  // ── State ─────────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: null, direction: null });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: defaultPageSize,
    total: 0,
  });
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  // ── Server-side fetch ─────────────────────────────────────────────────────
  const fetchRef = useRef(fetchData);
  fetchRef.current = fetchData;

  const doFetch = useCallback(async () => {
    if (!fetchRef.current) return;
    setLoading(true);
    try {
      const result = await fetchRef.current({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortKey: sort.key,
        sortDirection: sort.direction,
        search,
        filters: externalFilters,
      });
      setRows(result.rows);
      setPagination((p) => ({ ...p, total: result.total }));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sort, search, externalFilters]);

  useEffect(() => {
    if (fetchData) doFetch();
  }, [fetchData, doFetch]);

  // ── Client-side processing ─────────────────────────────────────────────────
  const processedRows = useMemo(() => {
    if (fetchData) return rows; // server handles it
    let r = data ?? [];
    r = clientFilter(r, search, columnsProp);
    // apply external filters
    if (Object.keys(externalFilters).length) {
      r = r.filter((row) =>
        Object.entries(externalFilters).every(([k, v]) => {
          if (v === null || v === undefined || v === "") return true;
          const val = getNestedValue(row as Record<string, unknown>, k);
          return String(val ?? "").toLowerCase().includes(String(v).toLowerCase());
        })
      );
    }
    r = clientSort(r, sort);
    return r;
  }, [data, fetchData, rows, search, externalFilters, sort, columnsProp]);

  const totalRows = fetchData ? pagination.total : processedRows.length;

  const pagedRows = useMemo(() => {
    if (!paginated || fetchData) return processedRows;
    const start = (pagination.page - 1) * pagination.pageSize;
    return processedRows.slice(start, start + pagination.pageSize);
  }, [processedRows, paginated, fetchData, pagination.page, pagination.pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalRows / pagination.pageSize));

  // ── Selection ─────────────────────────────────────────────────────────────
  const getRowKey = useCallback(
    (row: T, i: number): string | number => {
      if (rowKey) return rowKey(row, i);
      const r = row as Record<string, unknown>;
      return (r["id"] ?? r["_id"] ?? i) as string | number;
    },
    [rowKey]
  );

  const selectedRows = useMemo(
    () => pagedRows.filter((r, i) => selected.has(getRowKey(r, i))),
    [pagedRows, selected, getRowKey]
  );

  useEffect(() => {
    onSelectionChange?.(selectedRows);
  }, [selectedRows, onSelectionChange]);

  const allPageSelected =
    pagedRows.length > 0 && pagedRows.every((r, i) => selected.has(getRowKey(r, i)));
  const somePageSelected =
    pagedRows.some((r, i) => selected.has(getRowKey(r, i))) && !allPageSelected;

  function toggleRow(row: T, i: number) {
    const k = getRowKey(row, i);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pagedRows.forEach((r, i) => next.delete(getRowKey(r, i)));
      } else {
        pagedRows.forEach((r, i) => next.add(getRowKey(r, i)));
      }
      return next;
    });
  }

  // ── Sort ─────────────────────────────────────────────────────────────────
  function handleSort(key: string) {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
    setPagination((p) => ({ ...p, page: 1 }));
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  function goToPage(p: number) {
    setPagination((prev) => ({ ...prev, page: Math.min(Math.max(1, p), totalPages) }));
  }

  // ── Class helpers ─────────────────────────────────────────────────────────
  const cx = (...args: (string | undefined | false)[]) =>
    args.filter(Boolean).join(" ");

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={cx("flex flex-col gap-3 w-full font-sans", classes.wrapper)}>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        className={cx(
          "flex flex-wrap items-center gap-2 justify-between",
          classes.toolbar
        )}
      >
        {/* Search */}
        {searchable && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Search…"
              className={cx(
                "pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200",
                "bg-white text-slate-800 placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                "w-full transition",
                classes.searchInput
              )}
            />
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Column toggle */}
          {columnToggle && (
            <div className="relative" ref={colMenuRef}>
              <button
                onClick={() => setShowColMenu((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                  rounded-lg border border-slate-200 bg-white text-slate-700
                  hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
                Columns
              </button>
              {showColMenu && (
                <div className="absolute right-0 mt-1 z-30 bg-white border border-slate-200
                  rounded-xl shadow-lg p-3 min-w-[180px] flex flex-col gap-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 px-1">
                    Visible columns
                  </p>
                  {columnsProp.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                        hover:bg-slate-50 cursor-pointer text-sm text-slate-700 select-none"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600
                          focus:ring-indigo-500 cursor-pointer"
                        checked={visibility[col.key] !== false}
                        onChange={(e) =>
                          setVisibility((prev) => ({ ...prev, [col.key]: e.target.checked }))
                        }
                      />
                      <span className="truncate">
                        {typeof col.header === "string" ? col.header : col.key}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export */}
          {exportable && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => exportToCSV(processedRows, columnsProp)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                  rounded-lg border border-slate-200 bg-white text-slate-700
                  hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>
              <button
                onClick={() => exportToExcel(processedRows, columnsProp)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                  rounded-lg border border-slate-200 bg-white text-slate-700
                  hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                      a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table
          className={cx("w-full border-collapse text-sm", classes.table)}
          aria-label={caption}
        >
          {caption && <caption className="sr-only">{caption}</caption>}

          {/* ── THEAD ───────────────────────────────────────────────────── */}
          <thead className={cx("bg-slate-50 border-b border-slate-200", classes.thead)}>
            <tr className={classes.theadRow}>
              {selectable && (
                <th
                  className={cx(
                    "px-4 py-3 text-left",
                    classes.checkboxCell ?? classes.th
                  )}
                  style={{ width: "40px" }}
                >
                  <Checkbox
                    checked={allPageSelected}
                    indeterminate={somePageSelected}
                    onChange={toggleAll}
                    label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cx(
                    "px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap",
                    col.sortable && "cursor-pointer select-none hover:text-slate-900",
                    classes.th,
                    col.headerClassName
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sort.key === col.key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <SortIcon direction={sort.key === col.key ? sort.direction : null} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── TBODY ───────────────────────────────────────────────────── */}
          <tbody className={cx("divide-y divide-slate-100", classes.tbody)}>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-indigo-500" fill="none"
                      viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {loadingText}
                  </span>
                </td>
              </tr>
            ) : pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              pagedRows.map((row, rowIdx) => {
                const key = getRowKey(row, rowIdx);
                const isSelected = selected.has(key);
                return (
                  <tr
                    key={key}
                    className={cx(
                      "transition-colors",
                      classes.tr,
                      isSelected
                        ? cx("bg-indigo-50", classes.trSelected)
                        : cx("hover:bg-slate-50", classes.trHover)
                    )}
                  >
                    {selectable && (
                      <td
                        className={cx(
                          "px-4 py-3",
                          classes.checkboxCell ?? classes.td
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleRow(row, rowIdx)}
                          label={`Select row ${rowIdx + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const rawVal = getNestedValue(
                        row as Record<string, unknown>,
                        col.key
                      );
                      return (
                        <td
                          key={col.key}
                          className={cx(
                            "px-4 py-3 text-slate-700",
                            classes.td,
                            col.cellClassName
                          )}
                        >
                          {col.cell
                            ? col.cell(rawVal, row, rowIdx)
                            : rawVal === null || rawVal === undefined
                            ? "—"
                            : String(rawVal)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* ── TFOOT ───────────────────────────────────────────────────── */}
          {showSummary && columns.some((c) => c.summary) && (
            <tfoot className={cx(
              "bg-slate-100 border-t-2 border-slate-200 font-semibold text-slate-700",
              classes.tfoot
            )}>
              <tr className={classes.tfootRow}>
                {selectable && (
                  <td className={cx("px-4 py-3", classes.tfootCell)} />
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx("px-4 py-3", classes.tfootCell)}
                  >
                    {col.summary ? col.summary(processedRows) : null}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {paginated && (
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
                : `Showing ${Math.min((pagination.page - 1) * pagination.pageSize + 1, totalRows)}–${Math.min(
                    pagination.page * pagination.pageSize,
                    totalRows
                  )} of ${totalRows}`}
            </span>
            {/* Page size selector */}
            <select
              value={pagination.pageSize}
              onChange={(e) =>
                setPagination((p) => ({ ...p, pageSize: Number(e.target.value), page: 1 }))
              }
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
            <PaginationButton onClick={() => goToPage(1)} disabled={pagination.page === 1} label="First">
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
      )}
    </div>
  );
}

export default DataTable;