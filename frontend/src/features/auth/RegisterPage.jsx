// frontend/src/features/auth/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";

import { useRegisterMutation } from "../../store/api/authApi";
import { extractErrorMessage, extractFieldErrors } from "../../utils/apiError";
import AuthLayout from "./components/AuthLayout";
import FormField from "./components/FormField";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  role: "teacher",
  password: "",
  password_confirm: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [registerMutation, { isLoading }] = useRegisterMutation();

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    try {
      await registerMutation(form).unwrap();
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      setFormError(extractErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      heading="Join Learn Smart"
      subheading="Turn lesson PDFs into quizzes, grade in seconds and keep every class on track."
      title="Create your account"
      subtitle="It only takes a minute."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First + Last name in a 2-col row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="first_name"
            label="First name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="Esther"
            required
            autoComplete="given-name"
          />
          <FormField
            id="last_name"
            label="Last name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Howard"
            required
            autoComplete="family-name"
          />
        </div>

        {/* Email */}
        <FormField
          id="email"
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="bill.sanders@example.com"
          icon={Mail}
          autoComplete="email"
          required
        />

        {/* Role dropdown styled like a FormField */}
        <div>
          <label htmlFor="role" className="block text-sm font-semibold text-ink-800">
            I am a
          </label>
          <div className="relative mt-2">
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="h-12 w-full appearance-none rounded-2xl border border-ink-100 bg-white pl-4 pr-10 text-sm text-ink-900 outline-none transition-all focus:border-ink-500 focus:ring-4 focus:ring-sage-200"
            >
              <option value="teacher">Teacher</option>
                          </select>
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="m6 8 4 4 4-4" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Password */}
        <FormField
          id="password"
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••••••"
          icon={Lock}
          autoComplete="new-password"
          required
        />

        {/* Confirm password */}
        <FormField
          id="password_confirm"
          label="Confirm password"
          type="password"
          name="password_confirm"
          value={form.password_confirm}
          onChange={handleChange}
          placeholder="••••••••••••"
          icon={Lock}
          autoComplete="new-password"
          required
        />

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border-2 border-ink-500 bg-white transition-all checked:border-ink-800 checked:bg-ink-800 checked:bg-center checked:bg-no-repeat focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-200"
            style={
              agreed
                ? {
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='white' d='M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z'/></svg>\")",
                    backgroundSize: "14px",
                  }
                : {}
            }
          />
          <span>
            I agreed to the{" "}
            <Link
              to="/terms"
              className="font-semibold text-ink-800 underline decoration-ink-200 underline-offset-4 transition-colors hover:decoration-ink-500"
            >
              Terms &amp; Conditions
            </Link>
          </span>
        </label>

        {/* Field errors from backend */}
        {Object.keys(fieldErrors).length > 0 && (
          <ul className="space-y-1 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-700">
            {Object.entries(fieldErrors).map(([field, msg]) => (
              <li key={field}>
                <span className="font-semibold capitalize">{field.replace("_", " ")}: </span>
                {msg}
              </li>
            ))}
          </ul>
        )}

        {/* Form-level error */}
        {formError && !success && (
          <p role="alert" className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
            {formError}
          </p>
        )}

        {/* Success */}
        {success && (
          <p className="text-sm font-semibold text-emerald-600">
            Account created — redirecting to sign in…
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !agreed}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink-800 px-6 text-sm font-bold text-white transition-colors hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Creating account…" : "Sign Up"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-bold text-ink-800 underline decoration-ink-200 underline-offset-4 transition-colors hover:decoration-ink-500"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}