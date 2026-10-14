// frontend/src/components/ui/Input.jsx
import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, className = "", id, name, theme, ...props },
  ref
) {
  const inputId = id || name;

  const baseClasses =
    theme === "parchment"
      ? "mt-2 h-11 w-full rounded-xl border-2 border-amber-300 bg-[#FFFDF7] px-4 text-sm text-slate-800 placeholder:text-amber-400/60 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-300/50"
      : "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100";

  const labelClasses =
    theme === "parchment"
      ? "block text-xs font-bold text-amber-900"
      : "block text-xs font-bold text-navy-950";

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        name={name}
        className={`${baseClasses} ${error ? "border-coral-400" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-coral-600">
          {Array.isArray(error) ? error.join(" ") : error}
        </p>
      )}
    </div>
  );
});

export default Input;