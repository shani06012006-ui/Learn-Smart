import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { GraduationCap } from "lucide-react";

import { useAdminLoginMutation } from "../../store/api/realApi";
import { adminCredentialsReceived } from "../../store/slices/adminAuthSlice";
import { extractErrorMessage } from "../../utils/apiError";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

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

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const isLoading = adminLoginState.isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Real backend login. One path for every role.
    try {
      const result = await adminLogin(form).unwrap();
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
    <div className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">
            Sign in to Learn Smart
          </h1>
          <p className="text-sm text-ink-500">
            Auto-learning &amp; grading platform
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm"
        >
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

        <p className="mt-6 text-center text-xs text-ink-500">
          Students join a class using the code their teacher gives them — after
          your teacher adds you, sign in here with the email they used.
        </p>
      </div>
    </div>
  );
}