// frontend/src/features/auth/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowRight, Loader2, Lock, User } from "lucide-react";

import { useAdminLoginMutation } from "../../store/api/realApi";
import { useGoogleLoginMutation } from "../../store/api/googleAuthApi";
import { adminCredentialsReceived } from "../../store/slices/adminAuthSlice";
import AuthLayout from "./components/AuthLayout";
import FormField from "./components/FormField";
import GoogleSignInButton from "./components/GoogleSignInButton";
import OtpLoginModal from "./components/OtpLoginModal";

const ROLE_HOME = { admin: "/admin", teacher: "/teacher", student: "/student" };

// Turn an RTK Query error into a message a person can act on.
function loginErrorMessage(err, fallback) {
  const isNetwork =
    err?.status === "FETCH_ERROR" ||
    err?.error === "TypeError: Failed to fetch" ||
    (typeof err?.error === "string" && err.error.includes("fetch"));
  if (isNetwork) return "Couldn't reach the server. Please try again.";
  // A Django 500 page is HTML, which RTK Query reports as PARSING_ERROR + originalStatus.
  const httpStatus = typeof err?.status === "number" ? err.status : err?.originalStatus;
  if (typeof httpStatus === "number" && httpStatus >= 500 && httpStatus !== 503) {
    return "Something went wrong on our side. Please try again in a moment.";
  }
  const detail = err?.data?.error?.detail || err?.data?.detail;
  return typeof detail === "string" && detail ? detail : fallback;
}

export default function LoginPage() {
  const [adminLogin, adminLoginState] = useAdminLoginMutation();
  const [googleLogin, googleLoginState] = useGoogleLoginMutation();
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
  const busy = isLoading || googleLoginState.isLoading;

  // Shared by every login method.
  const finishLogin = (result) => {
    dispatch(adminCredentialsReceived(result));

    const role = result.user?.role;
    const defaultRedirect = ROLE_HOME[role] || "/";

    // If a ProtectedRoute bounce sent the user here, respect it only when the
    // target path matches the role we just logged in as.
    const from = location.state?.from;
    const allowed = from && ROLE_HOME[role] && from.startsWith(ROLE_HOME[role]);

    navigate(allowed ? from : defaultRedirect, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const result = await adminLogin({ ...form, remember_me: rememberMe }).unwrap();
      finishLogin(result);
    } catch (err) {
      setFormError(loginErrorMessage(err, "Invalid email or password."));
    }
  };

  // Google gives us a signed ID token; the backend verifies it and signs us in.
  const handleGoogleCredential = async (credential) => {
    setFormError(null);
    try {
      const result = await googleLogin({ credential, remember_me: rememberMe }).unwrap();
      finishLogin(result);
    } catch (err) {
      setFormError(loginErrorMessage(err, "Google sign-in failed. Please try again."));
    }
  };

  return (
    <AuthLayout
      heading="Welcome back to Learn Smart"
      subheading="Create quizzes from your lesson PDFs, grade in seconds and see how every class is doing."
      title="Welcome back"
      subtitle="Teachers and school admins, log in to continue."
    >
      {/* Google */}
      <GoogleSignInButton
        text="continue_with"
        fallbackLabel="Continue with Google"
        disabled={busy}
        onCredential={handleGoogleCredential}
        onError={setFormError}
      />

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-ink-100" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          or log in with your email
        </span>
        <span className="h-px flex-1 bg-ink-100" />
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
          placeholder="you@school.edu"
          icon={User}
        />

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

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <label className="flex cursor-pointer select-none items-center gap-2 whitespace-nowrap text-sm text-ink-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-ink-200 accent-ink-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-200"
            />
            <span>Remember me for 30 days</span>
          </label>
          {/* Doubles as password recovery: sign in with an emailed code instead. */}
          {/* <button
            type="button"
            onClick={() => setOtpOpen(true)}
            className="whitespace-nowrap rounded text-sm font-semibold text-ink-700 underline decoration-ink-200 underline-offset-4 transition-colors hover:text-ink-900 hover:decoration-ink-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-200"
          >
            Use a one-time code
          </button> */}
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700"
          >
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink-800 px-6 text-sm font-bold text-white transition-colors hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Logging in…
            </>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-ink-500">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-bold text-ink-800 underline decoration-ink-200 underline-offset-4 transition-colors hover:decoration-ink-500"
        >
          Sign up
        </Link>
      </p>

      {/* Student quick-login link */}
      <div className="mt-6 border-t border-ink-100 pt-5">
        <Link
          to="/student-login"
          className="group flex items-center gap-3 rounded-2xl bg-sage-100 px-4 py-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-sage-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-300"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-[10px] font-black text-white">
            PIN
          </span>
          <span className="flex-1">Are you a student? Sign in with your student code</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
        <p className="mt-3 text-center text-xs text-ink-400">
          First time here? Open the activation link your school sent you to choose your password.
        </p>
      </div>

      <OtpLoginModal open={otpOpen} onClose={() => setOtpOpen(false)} />
    </AuthLayout>
  );
}