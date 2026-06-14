import {ReactNode} from "react";

type EmptyProps<T> = {
  columnSize: number;
  selectable?: boolean;
  children?: ReactNode;
};

export default function Empty<T>({ columnSize, selectable, children }: EmptyProps<T>) {
    return (
        <tr>
            <td
                colSpan={columnSize + (selectable ? 1 : 0)}
                className="px-4 py-12 text-center text-slate-400"
            >
                {children || "No Records Found"}
            </td>
        </tr>
    )
}