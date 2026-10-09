// frontend/src/features/auth/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { User, Lock } from "lucide-react";

import { useAdminLoginMutation } from "../../store/api/realApi";
import { adminCredentialsReceived } from "../../store/slices/adminAuthSlice";
import AuthLayout from "./components/AuthLayout";
import FormField from "./components/FormField";
import SocialButton from "./components/SocialButton";
import OtpLoginModal from "./components/OtpLoginModal";

// One login form for all three roles, backed by the real Django backend.
// The response contains { access, refresh, user } — the access token is a
// real JWT signed by the backend, and `user.role` determines the redirect.
export default function LoginPage() {
  const [adminLogin, adminLoginState] = useAdminLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const isLoading = adminLoginState.isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Real backend login. One path for every role.
    try {
      const result = await adminLogin({ ...form, remember_me: rememberMe }).unwrap();
      dispatch(adminCredentialsReceived(result));

      const role = result.user?.role;
      const defaultRedirect =
        role === "admin"
          ? "/admin"
          : role === "teacher"
          ? "/teacher"
          : role === "student"
          ? "/student"
          : "/";

      // If a ProtectedRoute bounce sent the user here, respect it only when
      // the target path matches the role we just logged in as.
      const from = location.state?.from;
      const allowed =
        from &&
        ((role === "admin" && from.startsWith("/admin")) ||
          (role === "teacher" && from.startsWith("/teacher")) ||
          (role === "student" && from.startsWith("/student")));

      navigate(allowed ? from : defaultRedirect, { replace: true });
    } catch (err) {
      const isNetwork =
        err?.status === "FETCH_ERROR" ||
        err?.error === "TypeError: Failed to fetch" ||
        (typeof err?.error === "string" && err.error.includes("fetch"));

      setFormError(
        isNetwork
          ? "Couldn't reach the server. Please try again."
          : "Invalid email or password."
      );
    }
  };

  return (
    <AuthLayout
      heading={
        <>
          Welcome back to{" "}
          <span className="text-coral-500">Learn Smart</span> Online Learning Platform
        </>
      }
      illustrationSrc=""
    >
      {/* Google */}
      <SocialButton
        label="Login with google"
        onClick={() => {}}
      />

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Or login with your email
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          id="email"
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="bill.sanders@example.com"
          icon={User}
        />

        <div>
          <FormField
            id="password"
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••••••"
            icon={Lock}
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOtpOpen(true)}
              className="text-xs font-semibold text-purple-500 transition-colors hover:text-purple-600"
            >
              Login with One-Time Code
            </button>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-purple-500 transition-colors hover:text-purple-600"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-purple-500 accent-purple-500 focus:ring-purple-400"
          />
          <span>Remember me for 30 days</span>
        </label>

        {formError && (
          <p role="alert" className="text-sm text-coral-600">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-6 text-sm font-bold text-white shadow-purple-glow transition-all hover:bg-purple-600 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Logging in…" : "Login"}
        </button>
      </form>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-bold text-purple-500 transition-colors hover:text-purple-600"
        >
          Sign up
        </Link>
      </p>

      {/* Student quick-login link */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <Link
          to="/student-login"
          className="group flex items-center justify-center gap-2 rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-sm font-semibold text-purple-700 transition-all hover:border-purple-200 hover:bg-purple-100 hover:shadow-purple-glow"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500 text-[10px] font-black text-white">
            PIN
          </span>
          <span>Are you a student? Sign in with your Student Passcode</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
      <OtpLoginModal open={otpOpen} onClose={() => setOtpOpen(false)} />
    </AuthLayout>
  );
}