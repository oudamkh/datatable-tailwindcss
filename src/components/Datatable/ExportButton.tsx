"use client";

import { useState, useRef, useEffect } from "react";
import { RowData, ColumnDef, ExportFormat, ExportOptions } from "./datatable.types";

interface ExportButtonProps<T extends RowData> {
  rows: T[];
  columns: ColumnDef<T>[];
  options: ExportOptions;
}

// ── Pure export logic (no external libraries) ─────────────────────────────────
function getCellValue<T extends RowData>(row: T, col: ColumnDef<T>): string {
  if (col.exportValue) return String(col.exportValue(row) ?? "");
  const v = row[col.key];
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function exportCSV<T extends RowData>(
  rows: T[],
  columns: ColumnDef<T>[],
  filename: string
) {
  const escape = (s: string) =>
    /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;

  const header = columns.map((c) => escape(c.label ?? c.key)).join(",");
  const body = rows.map((row) =>
    columns.map((col) => escape(getCellValue(row, col))).join(",")
  );
  const csv = [header, ...body].join("\n");
  download(`${filename}.csv`, csv, "text/csv;charset=utf-8;");
}

function exportJSON<T extends RowData>(
  rows: T[],
  columns: ColumnDef<T>[],
  filename: string
) {
  const data = rows.map((row) =>
    Object.fromEntries(columns.map((col) => [col.key, getCellValue(row, col)]))
  );
  const json = JSON.stringify(data, null, 2);
  download(`${filename}.json`, json, "application/json");
}

function download(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ExportButton<T extends RowData>({
  rows,
  columns,
  options,
}: ExportButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const formats = options.formats ?? ["csv", "json"];
  const filename = options.filename ?? "export";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleExport = (format: ExportFormat) => {
    setOpen(false);
    if (format === "csv") exportCSV(rows, columns, filename);
    if (format === "json") exportJSON(rows, columns, filename);
  };

  const formatLabel: Record<ExportFormat, string> = {
    csv: "Export as CSV",
    json: "Export as JSON",
  };

  const formatIcon: Record<ExportFormat, string> = {
    csv: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    json: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg",
          "border border-slate-200 bg-white text-slate-700",
          "hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
          "transition-all duration-150 select-none",
          open && "bg-slate-50 border-slate-300",
        ].join(" ")}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
        <svg
          className={["w-3.5 h-3.5 text-slate-400 transition-transform duration-150", open && "rotate-180"].join(" ")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/60 py-1 animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            {rows.length} row{rows.length !== 1 ? "s" : ""}
          </div>
          {formats.map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={formatIcon[fmt]} />
              </svg>
              {formatLabel[fmt]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
