# DataTable Component

A fully-featured, reusable data table built with **Next.js (App Router)**, **TypeScript**, and **TailwindCSS**. Supports both client-side and server-side data, sorting, pagination, row selection, and a summary `<tfoot>` row — with **zero inline styles**.

---

## File Structure

```
datatable/
├── components/
│   └── DataTable/
│       ├── DataTable.tsx       ← Main component
│       ├── Checkbox.tsx        ← Accessible checkbox (with indeterminate state)
│       ├── Pagination.tsx      ← Pagination controls
│       ├── SortIcon.tsx        ← Sort direction indicators
│       ├── SkeletonRows.tsx    ← Loading skeleton
│       └── index.ts            ← Barrel export
├── hooks/
│   └── useDataTable.ts         ← useClientData, useServerData, useRowSelection, useTableControls
├── types/
│   ├── datatable.types.ts      ← All TypeScript interfaces
│   └── index.ts                ← Type barrel export
└── examples/
    ├── ClientSideExample.tsx   ← Full client-mode demo (employees)
    └── ServerSideExample.tsx   ← Full server-mode demo (orders)
```

---

## Quick Start

### Client-side mode

```tsx
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@/types";

interface User { id: number; name: string; email: string; }

const columns: ColumnDef<User>[] = [
  { key: "name",  label: "Name",  sortable: true },
  { key: "email", label: "Email", sortable: true },
];

export default function UsersPage() {
  return (
    <DataTable<User>
      mode="client"
      data={users}
      columns={columns}
      rowKey="id"
    />
  );
}
```

### Server-side mode

```tsx
import { DataTable } from "@/components/DataTable";
import { FetchFn } from "@/types";

const fetchUsers: FetchFn<User> = async ({ page, pageSize, sortKey, sortDirection }) => {
  const res = await fetch(
    `/api/users?page=${page}&pageSize=${pageSize}&sort=${sortKey}&dir=${sortDirection}`
  );
  return res.json(); // Must return { rows: User[], totalRows: number }
};

export default function UsersPage() {
  return (
    <DataTable<User>
      mode="server"
      fetchFn={fetchUsers}
      columns={columns}
      rowKey="id"
    />
  );
}
```

---

## API Reference

### `DataTableProps<T>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `"client" \| "server"` | — | **Required.** Data source mode. |
| `data` | `T[]` | — | *(client only)* Array of row objects. |
| `fetchFn` | `FetchFn<T>` | — | *(server only)* Async function returning `{ rows, totalRows }`. |
| `fetchParams` | `Record<string, unknown>` | `{}` | *(server only)* Extra params forwarded to every `fetchFn` call. |
| `columns` | `ColumnDef<T>[]` | — | **Required.** Column definitions. |
| `rowKey` | `keyof T` | — | **Required.** Unique identifier field for rows. |
| `selectable` | `boolean` | `false` | Enable checkbox selection. |
| `onSelectionChange` | `(rows: T[]) => void` | — | Fires when selection changes. |
| `defaultSelectedKeys` | `Set<string \| number>` | `new Set()` | Pre-selected row keys. |
| `defaultPageSize` | `number` | `10` | Initial rows per page. |
| `pageSizeOptions` | `number[]` | `[5,10,25,50,100]` | Options shown in the page-size selector. |
| `defaultSort` | `SortState` | `{ key: null, direction: null }` | Initial sort column and direction. |
| `summaryRenderer` | `SummaryRenderer<T>` | — | Renders `<td>` cells inside `<tfoot>`. |
| `classNames` | `ClassNameOverrides` | `{}` | Tailwind class overrides for each element. |
| `emptyState` | `ReactNode` | default SVG | Shown when there are no rows. |
| `loading` | `boolean` | — | Force the loading skeleton (auto-managed in server mode). |
| `caption` | `string` | — | Accessible table caption (visually hidden). |

---

### `ColumnDef<T>`

```ts
interface ColumnDef<T> {
  key: string;                                              // Field key in T
  label?: string;                                           // Column header text
  headerRender?: (col: ColumnDef<T>) => ReactNode;         // Custom <th> content
  cellRender?: (value, row: T, index: number) => ReactNode;// Custom <td> content
  sortable?: boolean;                                       // Click-to-sort
  cellClassName?: string;                                   // Tailwind for every <td>
  headerClassName?: string;                                 // Tailwind for <th>
  minWidthClass?: string;                                   // e.g. "min-w-[120px]"
}
```

**Custom header with icon + filter:**
```tsx
{
  key: "status",
  headerRender: (col) => (
    <span className="flex items-center gap-1.5">
      <FunnelIcon className="w-4 h-4 text-slate-400" />
      Status
    </span>
  ),
}
```

**Custom cell with badge:**
```tsx
{
  key: "status",
  cellRender: (val) => (
    <span className="rounded-full px-2.5 py-0.5 text-xs bg-emerald-100 text-emerald-800">
      {String(val)}
    </span>
  ),
}
```

---

### `FetchFn<T>`

```ts
type FetchFn<T> = (params: FetchParams) => Promise<FetchResult<T>>;

interface FetchParams {
  page: number;           // 1-indexed
  pageSize: number;
  sortKey: string | null;
  sortDirection: "asc" | "desc" | null;
  [key: string]: unknown; // extra params from `fetchParams` prop
}

interface FetchResult<T> {
  rows: T[];
  totalRows: number;      // Total matching rows (for pagination math)
}
```

---

### `SummaryRenderer<T>`

Receives `{ rows, allSelectedRows, columns }` and must return `<td>` elements (not a `<tr>`):

```tsx
const summaryRenderer: SummaryRenderer<Order> = ({ rows }) => {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <>
      <td className="px-4 py-2.5 text-slate-500" colSpan={3}>
        Page Total
      </td>
      <td className="px-4 py-2.5 font-bold text-right">
        ${total.toFixed(2)}
      </td>
    </>
  );
};
```

---

### `ClassNameOverrides`

```ts
interface ClassNameOverrides {
  wrapper?: string;      // Outermost div
  table?: string;        // <table>
  thead?: string;        // <thead>
  theadRow?: string;     // <tr> in thead
  th?: string;           // All <th> cells
  tbody?: string;        // <tbody>
  row?: string;          // Every data <tr>
  rowSelected?: string;  // Selected <tr>
  td?: string;           // All <td> cells
  tfoot?: string;        // <tfoot>
  tfootRow?: string;     // Summary <tr>
  tfootCell?: string;    // Summary <td>
  pagination?: string;   // Pagination bar
}
```

---

## Hooks (internal, re-exportable)

All hooks live in `hooks/useDataTable.ts` and can be imported for custom table implementations:

| Hook | Purpose |
|------|---------|
| `useTableControls(defaultSort, defaultPageSize)` | Manages sort + pagination state |
| `useClientData(data, pagination, sort, rowKey)` | Client-side sort + slice |
| `useServerData(fetchFn, pagination, sort, extra)` | Async fetch with abort-on-change |
| `useRowSelection(rows, rowKey, onChange, defaults)` | Selection state across pages |

---

## Accessibility

- `<table>` with `<caption>` (visually hidden via `sr-only`)
- `aria-sort` on sortable `<th>` cells
- `aria-label` on all checkboxes
- `aria-current="page"` on active pagination button
- Keyboard-navigable checkboxes and buttons
- `<label>` wrapping each checkbox

---

## Tailwind Configuration

Ensure your `tailwind.config.js` includes the component paths:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    // Add your datatable path:
    "./components/DataTable/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
```

---

## Design Decisions

- **No inline styles** — all visual logic lives in Tailwind utility classes.
- **Generic `<T extends RowData>`** — full TypeScript type-safety for row data.
- **Hooks separation** — `useClientData` / `useServerData` are independently testable.
- **Abort on re-fetch** — server mode cancels in-flight requests when params change.
- **Selection persists across pages** — `selectedRowMap` tracks full row objects, not just keys.
- **Indeterminate checkbox** — uses a DOM callback ref (not `useEffect`) to set the non-HTML attribute.
