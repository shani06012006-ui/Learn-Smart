import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { GraduationCap } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useAdminLoginMutation } from "../../store/api/realApi";
import { adminCredentialsReceived } from "../../store/slices/adminAuthSlice";
import { extractErrorMessage } from "../../utils/apiError";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

// One login form for all three roles. Tries the mock teacher/student
// backend first (fast, in-memory, no network); if it rejects, falls back
// to the real Django admin login. Whichever succeeds decides the redirect.
//
// The two backends are independent:
//   - mock success -> autolearn.* localStorage + mock authSlice -> /teacher | /student
//   - real success -> admin.* localStorage + adminAuthSlice -> /admin
export default function LoginPage() {
  const { login, loginState } = useAuth();
  const [adminLogin, adminLoginState] = useAdminLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const isLoading = loginState.isLoading || adminLoginState.isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // --- 1. Try the mock teacher/student login first.
    try {
      const { user } = await login(form);
      const redirectTo =
        location.state?.from ||
        (user.role === "teacher" ? "/teacher" : "/student");
      navigate(redirectTo, { replace: true });
      return;
    } catch {
      // fall through to admin
    }

    // --- 2. Fall back to the real Django admin login.
    try {
      const result = await adminLogin(form).unwrap();
      dispatch(adminCredentialsReceived(result));

      // If an admin came here via a ProtectedRoute bounce, respect the
      // original path only when it's an /admin/* path. Otherwise send them
      // to the admin dashboard.
      const from = location.state?.from;
      const redirectTo =
        from && from.startsWith("/admin") ? from : "/admin";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // --- 3. Both failed. Distinguish network failure from bad creds.
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
    <div className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Sign in to Learn Smart</h1>
          <p className="text-sm text-ink-500">Auto-learning &amp; grading platform</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@school.edu"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
          />

          {formError && (
            <p role="alert" className="text-sm text-danger-700">
              {formError}
            </p>
          )}

          <Button type="submit" loading={isLoading} className="mt-2 w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Teacher or admin?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-500">
          Students join a class using the code their teacher gives them — after
          your teacher adds you, sign in here with the email they used.
        </p>

        <div className="mt-6 rounded-lg border border-ink-300 bg-white p-3 text-xs text-ink-500">
          <p className="mb-1 font-medium text-ink-700">Demo accounts (mock mode)</p>
          <p>Teacher: anita.iyer@greenwood.edu / password123</p>
          <p>Student: rahul.sharma@example.com / password123</p>
        </div>
      </div>
    </div>
  );
}