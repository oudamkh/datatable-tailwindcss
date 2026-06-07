"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate, label, className = "", ...props }, ref) => {
    // We handle the indeterminate DOM prop via a callback ref
    const setRef = (el: HTMLInputElement | null) => {
      if (el) el.indeterminate = !!indeterminate;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
    };

    return (
      <label className="inline-flex items-center cursor-pointer group">
        <span className="relative flex items-center justify-center">
          <input
            ref={setRef}
            type="checkbox"
            className={[
              "peer appearance-none w-4 h-4 rounded border-2 transition-all duration-150",
              "border-slate-400 bg-white",
              "checked:bg-indigo-600 checked:border-indigo-600",
              "indeterminate:bg-indigo-400 indeterminate:border-indigo-400",
              "hover:border-indigo-500 focus:outline-none focus-visible:ring-2",
              "focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "cursor-pointer",
              className,
            ].join(" ")}
            {...props}
          />
          {/* Checkmark */}
          <svg
            className="pointer-events-none absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
            viewBox="0 0 10 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 4l3 3 5-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Indeterminate dash */}
          <span className="pointer-events-none absolute w-2 h-0.5 bg-white opacity-0 peer-indeterminate:opacity-100 transition-opacity rounded-full" />
        </span>
        {label && (
          <span className="ml-2 text-sm text-slate-700 select-none">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
export default Checkbox;
