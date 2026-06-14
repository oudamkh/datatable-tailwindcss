import { ChangeEvent, useEffect, useRef } from "react";

export default function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
    />
  );
}