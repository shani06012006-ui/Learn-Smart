// frontend/src/features/auth/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";

import { useRegisterMutation } from "../../store/api/authApi";
import { extractErrorMessage, extractFieldErrors } from "../../utils/apiError";
import AuthLayout from "./components/AuthLayout";
import FormField from "./components/FormField";
import SocialButton from "./components/SocialButton";

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
      heading={
        <>
          Welcome to{" "}
          <span className="text-coral-500">Eduvi</span> Online Learning Platform
        </>
      }
      illustrationSrc=""
    >
      {/* Google */}
      <SocialButton label="Signup with google" onClick={() => {}} />

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Or signup with your email
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

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
          <label htmlFor="role" className="block text-xs font-bold text-navy-950">
            I am a
          </label>
          <div className="relative mt-2">
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              <option value="teacher">Teacher</option>
                          </select>
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border-2 border-coral-500 bg-white transition-all checked:border-coral-500 checked:bg-coral-500 checked:bg-center checked:bg-no-repeat"
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
              className="font-semibold text-purple-500 transition-colors hover:text-purple-600"
            >
              Terms &amp; Conditions
            </Link>
          </span>
        </label>

        {/* Field errors from backend */}
        {Object.keys(fieldErrors).length > 0 && (
          <ul className="space-y-1 text-sm text-coral-600">
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
          <p role="alert" className="text-sm text-coral-600">
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
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-6 text-sm font-bold text-white shadow-purple-glow transition-all hover:bg-purple-600 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Creating account…" : "Sign Up"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have account?{" "}
        <Link
          to="/login"
          className="font-bold text-purple-500 transition-colors hover:text-purple-600"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}