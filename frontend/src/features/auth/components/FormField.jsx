// frontend/src/features/auth/components/FormField.jsx
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function FormField({
  id,
  label,
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  icon: Icon,
  required,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const actualType = isPassword && showPassword ? "text" : type;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-navy-950">
          {label}
        </label>
      )}

      <div className="relative mt-2">
        {Icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={16} />
          </span>
        )}

        <input
          id={id}
          name={name}
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`h-12 w-full rounded-xl border border-slate-200 bg-white text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100 ${
            Icon ? "pl-11" : "pl-4"
          } ${isPassword ? "pr-12" : "pr-4"}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-navy-950"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}