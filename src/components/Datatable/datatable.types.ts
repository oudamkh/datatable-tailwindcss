import { ReactNode } from "react";

// ─── Generic Row Shape ────────────────────────────────────────────────────────
export type RowData = Record<string, unknown>;

// ─── Column-level Filters ─────────────────────────────────────────────────────
export interface ColumnFilterDef {
  /** Which UI control to render below the column header */
  type: "text" | "select" | "number-range" | "date-range";
  /** For type="select": list of { label, value } options */
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export type FilterOperator =
  | "contains"
  | "equals"
  | "gte"
  | "lte"
  | "between"
  | "inSet";

export interface ActiveColumnFilter {
  key: string;
  operator: FilterOperator;
  value: unknown; // string | number | [number,number] | string[]
}

// ─── Export ───────────────────────────────────────────────────────────────────
export type ExportFormat = "csv" | "json";

export interface ExportOptions {
  /** Formats to expose in the export menu (default: both) */
  formats?: ExportFormat[];
  /** File name without extension (default: "export") */
  filename?: string;
  /** Whether to export only visible columns (default: true) */
  visibleColumnsOnly?: boolean;
}

// ─── Column Definition ────────────────────────────────────────────────────────
export interface ColumnDef<T extends RowData = RowData> {
  /** Unique key matching a field in T (or a synthetic key for computed cols) */
  key: string;
  /** Text label shown in <th> */
  label?: string;
  /** Fully custom header cell content – replaces label when provided */
  headerRender?: (column: ColumnDef<T>) => ReactNode;
  /** Custom cell renderer */
  cellRender?: (value: unknown, row: T, rowIndex: number) => ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Tailwind class(es) applied to every <td> in this column */
  cellClassName?: string;
  /** Tailwind class(es) applied to the <th> of this column */
  headerClassName?: string;
  /** Column min-width as a Tailwind class e.g. "min-w-[120px]" */
  minWidthClass?: string;
  /** Column-level filter configuration */
  filter?: ColumnFilterDef;
  /** Whether this column can be hidden via the visibility panel (default: true) */
  hideable?: boolean;
  /** Custom value extractor used during export */
  exportValue?: (row: T) => string | number | boolean | null;
}

// ─── Sorting ──────────────────────────────────────────────────────────────────
export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  key: string | null;
  direction: SortDirection;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationState {
  page: number; // 1-indexed
  pageSize: number;
}

export interface PaginationMeta {
  totalRows: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

// ─── Server-side fetch ────────────────────────────────────────────────────────
export interface FetchParams {
  page: number;
  pageSize: number;
  sortKey: string | null;
  sortDirection: SortDirection;
  globalSearch: string;
  columnFilters: ActiveColumnFilter[];
  [key: string]: unknown;
}

export interface FetchResult<T extends RowData> {
  rows: T[];
  totalRows: number;
}

export type FetchFn<T extends RowData> = (
  params: FetchParams
) => Promise<FetchResult<T>>;

// ─── Summary (tfoot) ─────────────────────────────────────────────────────────
export interface SummaryRendererArgs<T extends RowData> {
  rows: T[];
  allSelectedRows: T[];
  columns: ColumnDef<T>[];
}

export type SummaryRenderer<T extends RowData> = (
  args: SummaryRendererArgs<T>
) => ReactNode;

// ─── Class-name overrides ─────────────────────────────────────────────────────
export interface ClassNameOverrides {
  wrapper?: string;
  toolbar?: string;
  table?: string;
  thead?: string;
  theadRow?: string;
  th?: string;
  tbody?: string;
  row?: string;
  rowSelected?: string;
  td?: string;
  tfoot?: string;
  tfootRow?: string;
  tfootCell?: string;
  pagination?: string;
}

// ─── Main DataTable Props ─────────────────────────────────────────────────────
interface DataTableBaseProps<T extends RowData> {
  columns: ColumnDef<T>[];
  rowKey: keyof T;

  // Selection
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  defaultSelectedKeys?: Set<string | number>;

  // Pagination
  defaultPageSize?: number;
  pageSizeOptions?: number[];

  // Sorting
  defaultSort?: SortState;

  // Search & filter
  searchable?: boolean;
  searchPlaceholder?: string;

  // Export
  exportOptions?: ExportOptions;

  // Column visibility
  columnVisibility?: boolean;
  defaultHiddenColumns?: string[];

  // Summary
  summaryRenderer?: SummaryRenderer<T>;

  // Styling
  classNames?: ClassNameOverrides;

  // Misc
  emptyState?: ReactNode;
  loading?: boolean;
  caption?: string;
}

export interface ClientDataTableProps<T extends RowData>
  extends DataTableBaseProps<T> {
  mode: "client";
  data: T[];
}

export interface ServerDataTableProps<T extends RowData>
  extends DataTableBaseProps<T> {
  mode: "server";
  fetchFn: FetchFn<T>;
  fetchParams?: Record<string, unknown>;
}

export type DataTableProps<T extends RowData> =
  | ClientDataTableProps<T>
  | ServerDataTableProps<T>;
