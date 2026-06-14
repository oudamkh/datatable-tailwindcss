"use client";

interface SkeletonProps {
  columns: number;
  rows?: number;
  selectable?: boolean;
}

export default function Skeleton({
  columns,
  rows = 5,
  selectable,
}: SkeletonProps) {
  const totalCols = selectable ? columns + 1 : columns;

  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="animate-pulse border-b border-slate-100">
          {Array.from({ length: totalCols }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <div
                className={[
                  "h-4 rounded bg-slate-200",
                  ci === 0 && selectable ? "w-4" : "w-full",
                  // Vary widths for realism
                  ci % 3 === 1 ? "max-w-[60%]" : ci % 3 === 2 ? "max-w-[80%]" : "",
                ].join(" ")}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
