"use client";

import { useState, useRef, useEffect } from "react";
import { ColumnDef, RowData } from "./datatable.types";
import Checkbox from "./Checkbox";

interface ColumnVisibilityPanelProps<T extends RowData> {
  columns: ColumnDef<T>[];
  hiddenColumns: Set<string>;
  onToggle: (key: string) => void;
  onShowAll: () => void;
}

export default function ColumnVisibilityPanel<T extends RowData>({
  columns,
  hiddenColumns,
  onToggle,
  onShowAll,
}: ColumnVisibilityPanelProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const hideableColumns = columns.filter((c) => c.hideable !== false);
  const hiddenCount = hideableColumns.filter((c) => hiddenColumns.has(c.key)).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg",
          "border bg-white text-slate-700 transition-all duration-150 select-none",
          "hover:bg-slate-50 hover:border-slate-300",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
          hiddenCount > 0
            ? "border-indigo-300 text-indigo-700 bg-indigo-50"
            : "border-slate-200",
          open && "bg-slate-50 border-slate-300",
        ].join(" ")}
        aria-haspopup="true"
        aria-expanded={open}
        title="Manage columns"
      >
        {/* Columns icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        Columns
        {hiddenCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
            {hiddenCount}
          </span>
        )}
        <svg
          className={["w-3.5 h-3.5 text-slate-400 transition-transform duration-150", open && "rotate-180"].join(" ")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden"
          role="dialog"
          aria-label="Column visibility"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Toggle Columns
            </span>
            {hiddenCount > 0 && (
              <button
                onClick={onShowAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Show all
              </button>
            )}
          </div>

          {/* Column list */}
          <div className="py-1 max-h-72 overflow-y-auto">
            {hideableColumns.map((col) => {
              const isHidden = hiddenColumns.has(col.key);
              return (
                <label
                  key={col.key}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors group"
                >
                  <Checkbox
                    checked={!isHidden}
                    onChange={() => onToggle(col.key)}
                    aria-label={`Toggle ${col.label ?? col.key} column`}
                  />
                  <span className={[
                    "text-sm transition-colors",
                    isHidden ? "text-slate-400 line-through" : "text-slate-700 group-hover:text-slate-900",
                  ].join(" ")}>
                    {col.label ?? col.key}
                  </span>
                  {isHidden && (
                    <span className="ml-auto text-xs text-slate-300">hidden</span>
                  )}
                </label>
              );
            })}
          </div>

          {/* Footer: visible count */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              {hideableColumns.length - hiddenCount} of {hideableColumns.length} columns visible
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
