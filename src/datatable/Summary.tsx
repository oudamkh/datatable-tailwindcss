import { ColumnDef, DataTableClasses } from "./datatable.type";
import { cx } from "./datatable.helper";

type SummaryProps<T> = {
    columns: ColumnDef<T>[];
    classes: DataTableClasses;
    selectable?: boolean;
    rows: T[];
}

export default function Summary<T>({columns, classes, selectable, rows}: SummaryProps<T>) {

    return (
            <tfoot className={cx(
              "bg-slate-100 border-t-2 border-slate-200 font-semibold text-slate-700",
              classes.tfoot
            )}>
              <tr className={classes.tfootRow}>
                {selectable && (
                  <td className={cx("px-4 py-3", classes.tfootCell)} />
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx("px-4 py-3", classes.tfootCell)}
                  >
                    {col.summary && col.summary(rows)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )
}