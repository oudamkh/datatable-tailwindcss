"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  RowData,
  SortState,
  PaginationState,
  FetchFn,
  FetchResult,
  ActiveColumnFilter,
} from "./datatable.types";

// ─── Client-side filtering helper ────────────────────────────────────────────
function applyClientFilters<T extends RowData>(
  data: T[],
  globalSearch: string,
  columnFilters: ActiveColumnFilter[]
): T[] {
  let result = data;

  // Global search: match any string field
  if (globalSearch.trim()) {
    const q = globalSearch.toLowerCase();
    result = result.filter((row) =>
      Object.values(row).some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }

  // Column-level filters
  for (const f of columnFilters) {
    result = result.filter((row) => {
      const raw = row[f.key];
      const val = raw ?? "";

      switch (f.operator) {
        case "contains":
          return String(val).toLowerCase().includes(String(f.value).toLowerCase());
        case "equals":
          return String(val).toLowerCase() === String(f.value).toLowerCase();
        case "inSet":
          return (f.value as string[]).includes(String(val));
        case "gte":
          return Number(val) >= Number(f.value);
        case "lte":
          return Number(val) <= Number(f.value);
        case "between": {
          const [lo, hi] = f.value as [number | string, number | string];
          const n = Number(val);
          const loN = lo !== "" ? Number(lo) : -Infinity;
          const hiN = hi !== "" ? Number(hi) : Infinity;
          return n >= loN && n <= hiN;
        }
        default:
          return true;
      }
    });
  }

  return result;
}

// ─── Client-side hook ─────────────────────────────────────────────────────────
export function useClientData<T extends RowData>(
  data: T[],
  pagination: PaginationState,
  sort: SortState,
  globalSearch: string,
  columnFilters: ActiveColumnFilter[],
  rowKey: keyof T
) {
  const filtered = useMemo(
    () => applyClientFilters(data, globalSearch, columnFilters),
    [data, globalSearch, columnFilters]
  );

  const sorted = useMemo(() => {
    if (!sort.key || !sort.direction) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key!];
      const bv = b[sort.key!];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort]);

  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pagination.pageSize));
  const start = (pagination.page - 1) * pagination.pageSize;
  const pageRows = sorted.slice(start, start + pagination.pageSize);

  return { pageRows, totalRows, totalPages, loading: false, allFilteredRows: sorted };
}

// ─── Server-side hook ─────────────────────────────────────────────────────────
export function useServerData<T extends RowData>(
  fetchFn: FetchFn<T>,
  pagination: PaginationState,
  sort: SortState,
  globalSearch: string,
  columnFilters: ActiveColumnFilter[],
  extraParams: Record<string, unknown> = {}
) {
  const [result, setResult] = useState<FetchResult<T>>({ rows: [], totalRows: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const filtersKey = JSON.stringify(columnFilters);

  const fetch = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const data = await fetchFn({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortKey: sort.key,
        sortDirection: sort.direction,
        globalSearch,
        columnFilters,
        ...extraParams,
      });
      setResult(data);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(e as Error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn, pagination.page, pagination.pageSize, sort.key, sort.direction, globalSearch, filtersKey, JSON.stringify(extraParams)]);

  useEffect(() => {
    fetch();
    return () => abortRef.current?.abort();
  }, [fetch]);

  const totalPages = Math.max(1, Math.ceil(result.totalRows / pagination.pageSize));

  return {
    pageRows: result.rows,
    allFilteredRows: result.rows, // server already filters
    totalRows: result.totalRows,
    totalPages,
    loading,
    error,
    refetch: fetch,
  };
}

// ─── Selection hook ───────────────────────────────────────────────────────────
export function useRowSelection<T extends RowData>(
  pageRows: T[],
  rowKey: keyof T,
  onSelectionChange?: (rows: T[]) => void,
  defaultKeys?: Set<string | number>
) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(
    defaultKeys ?? new Set()
  );
  const [selectedRowMap, setSelectedRowMap] = useState<Map<string | number, T>>(new Map());

  const toggle = useCallback(
    (row: T) => {
      const key = row[rowKey] as string | number;
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
      setSelectedRowMap((prev) => {
        const next = new Map(prev);
        next.has(key) ? next.delete(key) : next.set(key, row);
        return next;
      });
    },
    [rowKey]
  );

  const toggleAll = useCallback(() => {
    const pageKeys = pageRows.map((r) => r[rowKey] as string | number);
    const allSelected = pageKeys.every((k) => selectedKeys.has(k));

    setSelectedKeys((prev) => {
      const next = new Set(prev);
      allSelected ? pageKeys.forEach((k) => next.delete(k)) : pageKeys.forEach((k) => next.add(k));
      return next;
    });
    setSelectedRowMap((prev) => {
      const next = new Map(prev);
      if (allSelected) {
        pageKeys.forEach((k) => next.delete(k));
      } else {
        pageRows.forEach((r) => next.set(r[rowKey] as string | number, r));
      }
      return next;
    });
  }, [pageRows, rowKey, selectedKeys]);

  const isSelected = useCallback(
    (row: T) => selectedKeys.has(row[rowKey] as string | number),
    [selectedKeys, rowKey]
  );

  const isAllPageSelected =
    pageRows.length > 0 &&
    pageRows.every((r) => selectedKeys.has(r[rowKey] as string | number));

  const isPartiallySelected =
    !isAllPageSelected &&
    pageRows.some((r) => selectedKeys.has(r[rowKey] as string | number));

  const selectedRows = useMemo(() => Array.from(selectedRowMap.values()), [selectedRowMap]);

  useEffect(() => {
    onSelectionChange?.(selectedRows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeys]);

  return { selectedKeys, selectedRows, toggle, toggleAll, isSelected, isAllPageSelected, isPartiallySelected };
}

// ─── Sort + Pagination hook ───────────────────────────────────────────────────
export function useTableControls(
  defaultSort: SortState = { key: null, direction: null },
  defaultPageSize = 10
) {
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: defaultPageSize });

  const handleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => setPagination((p) => ({ ...p, page })), []);
  const setPageSize = useCallback((pageSize: number) => setPagination({ page: 1, pageSize }), []);

  return { sort, pagination, handleSort, setPage, setPageSize };
}

// ─── Search & Filter hook ─────────────────────────────────────────────────────
export function useSearchAndFilter() {
  const [globalSearch, setGlobalSearchRaw] = useState("");
  const [columnFilters, setColumnFilters] = useState<ActiveColumnFilter[]>([]);

  const setGlobalSearch = useCallback((value: string) => {
    setGlobalSearchRaw(value);
  }, []);

  const setColumnFilter = useCallback((filter: ActiveColumnFilter) => {
    setColumnFilters((prev) => {
      const without = prev.filter((f) => f.key !== filter.key);
      // Remove filter if value is empty
      const isEmpty =
        filter.value === "" ||
        filter.value === null ||
        filter.value === undefined ||
        (Array.isArray(filter.value) && filter.value.every((v) => v === "" || v === null));
      return isEmpty ? without : [...without, filter];
    });
  }, []);

  const clearColumnFilter = useCallback((key: string) => {
    setColumnFilters((prev) => prev.filter((f) => f.key !== key));
  }, []);

  const clearAllFilters = useCallback(() => {
    setGlobalSearchRaw("");
    setColumnFilters([]);
  }, []);

  const hasActiveFilters = globalSearch.trim() !== "" || columnFilters.length > 0;

  return {
    globalSearch,
    columnFilters,
    setGlobalSearch,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    hasActiveFilters,
  };
}

// ─── Column Visibility hook ───────────────────────────────────────────────────
export function useColumnVisibility(
  allKeys: string[],
  defaultHidden: string[] = []
) {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    new Set(defaultHidden)
  );

  const toggleColumn = useCallback((key: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const showAll = useCallback(() => setHiddenColumns(new Set()), []);

  const isVisible = useCallback(
    (key: string) => !hiddenColumns.has(key),
    [hiddenColumns]
  );

  const visibleKeys = allKeys.filter((k) => !hiddenColumns.has(k));

  return { hiddenColumns, toggleColumn, showAll, isVisible, visibleKeys };
}
