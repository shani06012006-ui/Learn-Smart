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
        <label htmlFor={id} className="block text-sm font-semibold text-ink-800">
          {label}
        </label>
      )}

      <div className="relative mt-2">
        {Icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">
            <Icon size={16} aria-hidden="true" />
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
          className={`h-12 w-full rounded-2xl border border-ink-100 bg-white text-sm text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-ink-500 focus:ring-4 focus:ring-sage-200 ${
            Icon ? "pl-11" : "pl-4"
          } ${isPassword ? "pr-12" : "pr-4"}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 transition-colors hover:text-ink-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-200"
          >
            {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}