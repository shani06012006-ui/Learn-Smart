import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { extractErrorMessage } from "../../utils/apiError";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function LoginPage() {
  const { login, loginState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const { user } = await login(form);
      const redirectTo = location.state?.from || (user.role === "teacher" ? "/teacher" : "/student");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(extractErrorMessage(err, "Login failed. Check your email and password."));
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

          <Button type="submit" loading={loginState.isLoading} className="mt-2 w-full">
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
