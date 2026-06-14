import {
  ReactNode
} from "react";

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T = Record<string, unknown>> {
  /** Unique key matching data object property */
  key: string;
  /** Header label or custom JSX */
  header: ReactNode;
  /** Custom cell renderer */
  cell?: (value: unknown, row: T, rowIndex: number) => ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Fixed width e.g. "120px", "10%" — omit for auto */
  width?: string;
  /** Summary cell renderer for tfoot */
  summary?: (rows: T[]) => ReactNode;
  /** Extra className for header cell */
  headerClassName?: string;
  /** Extra className for body cells */
  cellClassName?: string;
  /** Initial visibility */
  visible?: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  key: string | null;
  direction: SortDirection;
}

export interface FetchParams {
  page: number;
  pageSize: number;
  sortKey: string | null;
  sortDirection: SortDirection;
  search: string;
  filters: Record<string, unknown>;
}

export interface DataTableClasses {
  wrapper?: string;
  toolbar?: string;
  table?: string;
  thead?: string;
  theadRow?: string;
  th?: string;
  tbody?: string;
  tr?: string;
  trSelected?: string;
  trHover?: string;
  td?: string;
  tfoot?: string;
  tfootRow?: string;
  tfootCell?: string;
  pagination?: string;
  searchInput?: string;
  checkboxCell?: string;
}

export interface DataTableProps<T = Record<string, unknown>> {
  /** Column definitions */
  columns: ColumnDef<T>[];

  // ── Data modes ──
  /** Client-side data */
  data?: T[];
  /** Server-side fetch function */
  fetchData?: (params: FetchParams) => Promise<{ rows: T[]; total: number }>;

  // ── Features ──
  /** Enable row selection checkboxes */
  selectable?: boolean;
  /** Callback with currently selected rows */
  onSelectionChange?: (rows: T[]) => void;
  /** Enable global search bar */
  searchable?: boolean;
  /** External filter values (merged with internal search) */
  externalFilters?: Record<string, unknown>;
  /** Enable pagination */
  paginated?: boolean;
  /** Initial page size */
  defaultPageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Show tfoot summary row */
  showSummary?: boolean;
  /** Enable column visibility toggle */
  columnToggle?: boolean;
  /** Show export buttons */
  exportable?: boolean;
  /** Table caption for accessibility */
  caption?: string;

  // ── Class overrides ──
  classes?: DataTableClasses;

  // ── Misc ──
  /** Shown while loading */
  loadingText?: ReactNode;
  /** Shown when no data */
  emptyText?: ReactNode;
  /** Row key extractor */
  rowKey?: (row: T, index: number) => string | number;
}