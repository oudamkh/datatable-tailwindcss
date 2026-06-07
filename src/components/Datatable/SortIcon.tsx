"use client";

import { SortDirection } from "./datatable.types";

interface SortIconProps {
  direction: SortDirection;
  active: boolean;
}

export default function SortIcon({ direction, active }: SortIconProps) {
  return (
    <span className="inline-flex flex-col ml-1.5 gap-[2px] opacity-60 group-hover:opacity-100 transition-opacity">
      {/* Up arrow */}
      <svg
        width="8"
        height="5"
        viewBox="0 0 8 5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={[
          "transition-colors",
          active && direction === "asc"
            ? "text-indigo-600"
            : "text-slate-400",
        ].join(" ")}
      >
        <path
          d="M4 0L7.46 4.5H0.54L4 0Z"
          fill="currentColor"
        />
      </svg>
      {/* Down arrow */}
      <svg
        width="8"
        height="5"
        viewBox="0 0 8 5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={[
          "transition-colors",
          active && direction === "desc"
            ? "text-indigo-600"
            : "text-slate-400",
        ].join(" ")}
      >
        <path
          d="M4 5L0.54 0.5H7.46L4 5Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
