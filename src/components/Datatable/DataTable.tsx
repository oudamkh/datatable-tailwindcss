"use client";

import { ReactNode, useMemo } from "react";
import { DataTableProps, RowData, ColumnDef } from "./datatable.types";
import {
  useTableControls,
  useClientData,
  useServerData,
  useRowSelection,
  useSearchAndFilter,
  useColumnVisibility,
} from "./datatable.hooks";
import Checkbox from "./Checkbox";
import SortIcon from "./SortIcon";
import SkeletonRows from "./SkeletonRows";
import Pagination from "./Pagination";
import SearchBar from "./SearchBar";
import ColumnFiltersRow from "./ColumnFilters";
import ExportButton from "./ExportButton";
import ColumnVisibilityPanel from "./ColumnVisibilityPanel";

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const cn = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(" ");

function DataTableInner<T extends RowData>(props: DataTableProps<T>) {
  const {
    columns,
    rowKey,
    selectable = false,
    onSelectionChange,
    defaultSelectedKeys,
    defaultPageSize = 10,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    defaultSort = { key: null, direction: null },
    searchable = false,
    searchPlaceholder,
    exportOptions,
    columnVisibility: showColumnVisibility = false,
    defaultHiddenColumns = [],
    summaryRenderer,
    classNames = {},
    emptyState,
    caption,
  } = props;

  // ── Controls ────────────────────────────────────────────────────────────────
  const { sort, pagination, handleSort, setPage, setPageSize } =
    useTableControls(defaultSort, defaultPageSize);

  // ── Search & Filter ──────────────────────────────────────────────────────────
  const {
    globalSearch,
    columnFilters,
    setGlobalSearch,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    hasActiveFilters,
  } = useSearchAndFilter();

  // ── Column Visibility ────────────────────────────────────────────────────────
  const allColumnKeys = useMemo(() => columns.map((c) => c.key), [columns]);
  const { hiddenColumns, toggleColumn, showAll, visibleKeys } =
    useColumnVisibility(allColumnKeys, defaultHiddenColumns);

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleKeys.includes(c.key)),
    [columns, visibleKeys]
  );

  // ── Data ────────────────────────────────────────────────────────────────────
  // Reset page when filters change (handled inside hooks via dependencies)
  const clientResult =
    props.mode === "client"
      ? // eslint-disable-next-line react-hooks/rules-of-hooks
        useClientData(props.data, pagination, sort, globalSearch, columnFilters, rowKey)
      : null;

  const serverResult =
    props.mode === "server"
      ? // eslint-disable-next-line react-hooks/rules-of-hooks
        useServerData(props.fetchFn, pagination, sort, globalSearch, columnFilters, props.fetchParams)
      : null;

  const { pageRows, totalRows, totalPages, loading, allFilteredRows } =
    props.mode === "client" ? clientResult! : serverResult!;

  // ── Selection ───────────────────────────────────────────────────────────────
  const {
    selectedRows,
    toggle,
    toggleAll,
    isSelected,
    isAllPageSelected,
    isPartiallySelected,
  } = useRowSelection(pageRows, rowKey, onSelectionChange, defaultSelectedKeys);

  // ── Summary ──────────────────────────────────────────────────────────────────
  const summaryArgs = useMemo(
    () => ({ rows: pageRows, allSelectedRows: selectedRows, columns: visibleColumns }),
    [pageRows, selectedRows, visibleColumns]
  );

  // ── Export: rows to export = all filtered rows (client) or current page rows (server) ──
  const exportRows = props.mode === "client" ? (allFilteredRows ?? pageRows) : pageRows;
  const exportColumns = exportOptions?.visibleColumnsOnly !== false
    ? visibleColumns
    : columns;

  const visibleColCount = visibleColumns.length + (selectable ? 1 : 0);

  return (
    <div className={cn("flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden", classNames.wrapper)}>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      {(searchable || exportOptions || showColumnVisibility || hasActiveFilters) && (
        <div className={cn(
          "flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/60",
          classNames.toolbar
        )}>
          {/* Global Search */}
          {searchable && (
            <SearchBar
              value={globalSearch}
              onChange={(v) => { setGlobalSearch(v); setPage(1); }}
              placeholder={searchPlaceholder}
              className="flex-1 min-w-[180px] max-w-xs"
            />
          )}

          {/* Active filter badge */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
              {columnFilters.length > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold">
                  {columnFilters.length}
                </span>
              )}
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Export */}
          {exportOptions && (
            <ExportButton
              rows={exportRows}
              columns={exportColumns}
              options={exportOptions}
            />
          )}

          {/* Column Visibility */}
          {showColumnVisibility && (
            <ColumnVisibilityPanel
              columns={columns}
              hiddenColumns={hiddenColumns}
              onToggle={toggleColumn}
              onShowAll={showAll}
            />
          )}
        </div>
      )}

      {/* ── Scrollable table ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className={cn("w-full border-collapse text-sm text-left", classNames.table)}>
          {caption && <caption className="sr-only">{caption}</caption>}

          {/* ── THEAD ──────────────────────────────────────────────────────── */}
          <thead className={cn("bg-slate-50 border-b border-slate-200", classNames.thead)}>
            <tr className={cn("", classNames.theadRow)}>
              {selectable && (
                <th scope="col" className={cn("w-10 px-4 py-3", classNames.th)}>
                  <Checkbox
                    checked={isAllPageSelected}
                    indeterminate={isPartiallySelected}
                    onChange={toggleAll}
                    aria-label="Select all rows on this page"
                    disabled={pageRows.length === 0}
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 font-semibold text-slate-700 whitespace-nowrap",
                    col.sortable && "cursor-pointer select-none group hover:bg-slate-100 transition-colors",
                    col.minWidthClass,
                    col.headerClassName,
                    classNames.th
                  )}
                  onClick={col.sortable ? () => { handleSort(col.key); setPage(1); } : undefined}
                  aria-sort={
                    sort.key === col.key
                      ? sort.direction === "asc" ? "ascending" : "descending"
                      : "none"
                  }
                >
                  <span className="inline-flex items-center">
                    {col.headerRender ? col.headerRender(col) : (col.label ?? col.key)}
                    {col.sortable && (
                      <SortIcon
                        active={sort.key === col.key}
                        direction={sort.key === col.key ? sort.direction : null}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>

            {/* Column filter row */}
            <ColumnFiltersRow
              columns={columns}
              visibleColumns={visibleColumns}
              columnFilters={columnFilters}
              onFilterChange={(f) => { setColumnFilter(f); setPage(1); }}
              onFilterClear={(k) => { clearColumnFilter(k); setPage(1); }}
              selectable={selectable}
            />
          </thead>

          {/* ── TBODY ──────────────────────────────────────────────────────── */}
          <tbody className={cn("divide-y divide-slate-100", classNames.tbody)}>
            {loading ? (
              <SkeletonRows columns={visibleColumns.length} rows={pagination.pageSize} selectable={selectable} />
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="px-4 py-16 text-center text-slate-400">
                  {emptyState ?? (
                    <div className="flex flex-col items-center gap-2">
                      {hasActiveFilters ? (
                        <>
                          <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          <span className="text-sm font-medium">No results match your filters</span>
                          <button
                            onClick={clearAllFilters}
                            className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
                          >
                            Clear all filters
                          </button>
                        </>
                      ) : (
                        <>
                          <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M9 17v-2m3 2v-4m3 4v-6M4 6h16M4 10h16M4 14h10" />
                          </svg>
                          <span className="text-sm font-medium">No data found</span>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              pageRows.map((row, rowIndex) => {
                const key = row[rowKey] as string | number;
                const selected = isSelected(row);
                return (
                  <tr
                    key={key}
                    className={cn(
                      "transition-colors duration-100 hover:bg-indigo-50/50",
                      selected && "bg-indigo-50",
                      selected && classNames.rowSelected,
                      classNames.row
                    )}
                  >
                    {selectable && (
                      <td className={cn("w-10 px-4 py-3", classNames.td)}>
                        <Checkbox
                          checked={selected}
                          onChange={() => toggle(row)}
                          aria-label={`Select row ${key}`}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={cn("px-4 py-3 text-slate-700 align-middle", col.cellClassName, classNames.td)}
                      >
                        {col.cellRender
                          ? col.cellRender(row[col.key], row, rowIndex)
                          : String(row[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* ── TFOOT summary ──────────────────────────────────────────────── */}
          {summaryRenderer && !loading && pageRows.length > 0 && (
            <tfoot className={cn("border-t-2 border-slate-300 bg-slate-50", classNames.tfoot)}>
              <tr className={cn("font-semibold text-slate-800", classNames.tfootRow)}>
                {summaryRenderer(summaryArgs)}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      <Pagination
        pagination={pagination}
        totalRows={totalRows}
        totalPages={totalPages}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        className={classNames.pagination}
      />
    </div>
  );
}

export default function DataTable<T extends RowData>(props: DataTableProps<T>) {
  return <DataTableInner<T> {...props} />;
}
