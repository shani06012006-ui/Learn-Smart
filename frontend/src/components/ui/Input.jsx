// frontend/src/components/ui/Input.jsx
import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, className = "", id, name, ...props },
  ref
) {
  const inputId = id || name;
  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-navy-950"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        name={name}
        className={`mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100 ${
          error ? "border-coral-400" : ""
        } ${className}`}
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