"use client";

import { useCallback } from "react";
import { ColumnDef, ColumnFilterDef, ActiveColumnFilter, RowData } from "./datatable.types";

interface ColumnFiltersRowProps<T extends RowData> {
  columns: ColumnDef<T>[];
  visibleColumns: ColumnDef<T>[];
  columnFilters: ActiveColumnFilter[];
  onFilterChange: (filter: ActiveColumnFilter) => void;
  onFilterClear: (key: string) => void;
  selectable?: boolean;
}

// ── Individual filter cell ────────────────────────────────────────────────────
function FilterCell<T extends RowData>({
  col,
  filter,
  activeFilter,
  onFilterChange,
  onFilterClear,
}: {
  col: ColumnDef<T>;
  filter: ColumnFilterDef;
  activeFilter?: ActiveColumnFilter;
  onFilterChange: (f: ActiveColumnFilter) => void;
  onFilterClear: (key: string) => void;
}) {
  const inputClass =
    "w-full text-xs rounded border border-slate-200 bg-white px-2 py-1.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors";

  const currentVal = activeFilter?.value;

  const handleText = useCallback(
    (v: string) =>
      onFilterChange({ key: col.key, operator: "contains", value: v }),
    [col.key, onFilterChange]
  );

  const handleSelect = useCallback(
    (v: string) =>
      onFilterChange({ key: col.key, operator: "inSet", value: v ? [v] : [] }),
    [col.key, onFilterChange]
  );

  const handleRangeMin = useCallback(
    (v: string) => {
      const prev = Array.isArray(currentVal) ? (currentVal as [string, string]) : ["", ""];
      onFilterChange({ key: col.key, operator: "between", value: [v, prev[1]] });
    },
    [col.key, currentVal, onFilterChange]
  );

  const handleRangeMax = useCallback(
    (v: string) => {
      const prev = Array.isArray(currentVal) ? (currentVal as [string, string]) : ["", ""];
      onFilterChange({ key: col.key, operator: "between", value: [prev[0], v] });
    },
    [col.key, currentVal, onFilterChange]
  );

  if (filter.type === "text") {
    return (
      <div className="relative">
        <input
          type="text"
          value={typeof currentVal === "string" ? currentVal : ""}
          onChange={(e) => handleText(e.target.value)}
          placeholder={filter.placeholder ?? `Filter ${col.label ?? col.key}…`}
          className={inputClass}
        />
        {currentVal && (
          <button
            onClick={() => onFilterClear(col.key)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
            aria-label="Clear filter"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  if (filter.type === "select") {
    const selected = Array.isArray(currentVal) ? (currentVal as string[])[0] : "";
    return (
      <select
        value={selected ?? ""}
        onChange={(e) => handleSelect(e.target.value)}
        className={[inputClass, "pr-6 appearance-none bg-[right_0.5rem_center] bg-no-repeat"].join(" ")}
        style={{}}
      >
        <option value="">All</option>
        {filter.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (filter.type === "number-range" || filter.type === "date-range") {
    const [lo, hi] = Array.isArray(currentVal)
      ? (currentVal as [string, string])
      : ["", ""];
    const inputType = filter.type === "date-range" ? "date" : "number";
    return (
      <div className="flex items-center gap-1">
        <input
          type={inputType}
          value={lo ?? ""}
          onChange={(e) => handleRangeMin(e.target.value)}
          placeholder="Min"
          className={[inputClass, "min-w-0"].join(" ")}
        />
        <span className="text-slate-300 shrink-0">–</span>
        <input
          type={inputType}
          value={hi ?? ""}
          onChange={(e) => handleRangeMax(e.target.value)}
          placeholder="Max"
          className={[inputClass, "min-w-0"].join(" ")}
        />
      </div>
    );
  }

  return null;
}

// ── Full filter row (rendered as a second <tr> under the header) ───────────────
export default function ColumnFiltersRow<T extends RowData>({
  visibleColumns,
  columnFilters,
  onFilterChange,
  onFilterClear,
  selectable,
}: ColumnFiltersRowProps<T>) {
  const hasAnyFilter = visibleColumns.some((c) => !!c.filter);
  if (!hasAnyFilter) return null;

  return (
    <tr className="bg-white border-b border-slate-100">
      {selectable && <th className="w-10 px-4 py-1.5" />}
      {visibleColumns.map((col) => {
        const activeFilter = columnFilters.find((f) => f.key === col.key);
        return (
          <th key={col.key} className="px-4 py-1.5 font-normal">
            {col.filter ? (
              <FilterCell
                col={col}
                filter={col.filter}
                activeFilter={activeFilter}
                onFilterChange={onFilterChange}
                onFilterClear={onFilterClear}
              />
            ) : (
              <div className="h-6" /> // spacer for alignment
            )}
          </th>
        );
      })}
    </tr>
  );
}
