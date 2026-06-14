import { ColumnDef, SortState, SortDirection } from "./datatable.type";

export const cx = (...args: (string | undefined | false)[]) =>
    args.filter(Boolean).join(" ");

export function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

export function generatePageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [];
  pages.push(1);
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

export function clientFilter<T>(rows: T[], search: string, columns: ColumnDef<T>[]): T[] {
  if (!search.trim()) return rows;
  const q = search.toLowerCase();
  return rows.filter((row) =>
    columns.some((col) => {
      const val = getNestedValue(row as Record<string, unknown>, col.key);
      return String(val ?? "").toLowerCase().includes(q);
    })
  );
}

export function clientSort<T>(rows: T[], sort: SortState): T[] {
  if (!sort.key || !sort.direction) return rows;
  const key = sort.key;
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = getNestedValue(a as Record<string, unknown>, key);
    const bv = getNestedValue(b as Record<string, unknown>, key);
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

export function exportToCSV<T>(rows: T[], columns: ColumnDef<T>[], filename = "export.csv") {
  const visibleCols = columns.filter((c) => c.visible !== false);
  const header = visibleCols.map((c) => (typeof c.header === "string" ? c.header : c.key));
  const csvRows = rows.map((row) =>
    visibleCols.map((col) => {
      const val = getNestedValue(row as Record<string, unknown>, col.key);
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    })
  );
  const content = [header.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel<T>(rows: T[], columns: ColumnDef<T>[], filename = "export.xls") {
  const visibleCols = columns.filter((c) => c.visible !== false);
  const header = visibleCols.map((c) => (typeof c.header === "string" ? c.header : c.key));
  const dataRows = rows.map((row) =>
    visibleCols.map((col) => {
      const val = getNestedValue(row as Record<string, unknown>, col.key);
      return String(val ?? "");
    })
  );

  let xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Sheet1"><Table>`;

  const makeRow = (cells: string[], bold = false) =>
    `<Row>${cells
      .map(
        (c) =>
          `<Cell><Data ss:Type="String"${bold ? ' ss:Bold="1"' : ""}>${c
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</Data></Cell>`
      )
      .join("")}</Row>`;

  xml += makeRow(header, true);
  dataRows.forEach((r) => { xml += makeRow(r); });
  xml += `</Table></Worksheet></Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}