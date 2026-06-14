import { useMemo } from "react";
import { ColumnDef, DataTableClasses } from "./datatable.type";
import { cx } from "./datatable.helper";
import { getNestedValue } from "./datatable.helper";
import Checkbox from "./Checkbox";
import Skeleton from "./Skeleton";
import Empty from "./Empty";

type TBodyProps<T> = {
  columns: ColumnDef<T>[];
  classes: DataTableClasses;
  selectable?: boolean;
  loading: boolean;
  loadingText?: string;
  emptyRow?: React.ReactNode;
  pagedRows: T[];
  selected: Set<string>;
  getRowKey: (row: T, idx: number) => string;
  toggleRow: (row: T, idx: number) => void;
}

export default function TBody<T>({
  columns,
  classes,
  selectable,
  loading,
  emptyRow,
  pagedRows,
  selected,
  getRowKey,
  toggleRow
}: TBodyProps<T>) {

  const renderRecord = useMemo(() => {
    if (loading) return (<Skeleton columns={columns.length} rows={5} selectable={selectable} />);
    if (pagedRows.length === 0) return emptyRow || (<Empty columnSize={columns.length} selectable={selectable} />);
    return (
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
                      : !rawVal ? "--" : String(rawVal)}
                  </td>
                );
              })}
            </tr>
          );
        })
      );
  }, [columns, loading, selectable, pagedRows]);

  return (
    <tbody className={cx("divide-y divide-slate-100", classes.tbody)}>
      {renderRecord}
    </tbody>
  )
}