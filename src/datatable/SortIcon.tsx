import { SortDirection } from "./datatable.type";

export default function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <span className="inline-flex flex-col ml-1 gap-px">
      <svg
        className={`w-2 h-2 ${direction === "asc" ? "text-indigo-500" : "text-slate-300"}`}
        viewBox="0 0 8 5" fill="currentColor"
      >
        <path d="M4 0L8 5H0z" />
      </svg>
      <svg
        className={`w-2 h-2 ${direction === "desc" ? "text-indigo-500" : "text-slate-300"}`}
        viewBox="0 0 8 5" fill="currentColor"
      >
        <path d="M4 5L0 0h8z" />
      </svg>
    </span>
  );
}