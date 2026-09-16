import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

import { useRegisterMutation } from "../../store/api/authApi";
import { extractErrorMessage, extractFieldErrors } from "../../utils/apiError";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

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

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

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
    <div className="flex min-h-screen items-center justify-center bg-ink-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Create your account</h1>
          <p className="text-sm text-ink-500">For teachers and institution admins</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              name="first_name"
              required
              value={form.first_name}
              onChange={handleChange}
              error={fieldErrors.first_name}
            />
            <Input
              label="Last name"
              name="last_name"
              required
              value={form.last_name}
              onChange={handleChange}
              error={fieldErrors.last_name}
            />
          </div>

          <Input
            label="Email"
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
            placeholder="you@school.edu"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-medium text-ink-700">
              I am a
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="focus-ring rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900"
            >
              <option value="teacher">Teacher</option>
              <option value="admin">Institution Admin</option>
            </select>
          </div>

          <Input
            label="Password"
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />
          <Input
            label="Confirm password"
            type="password"
            name="password_confirm"
            required
            value={form.password_confirm}
            onChange={handleChange}
            error={fieldErrors.password_confirm}
          />

          {formError && !success && (
            <p role="alert" className="text-sm text-danger-700">
              {formError}
            </p>
          )}
          {success && (
            <p className="text-sm text-success-700">Account created — redirecting to sign in...</p>
          )}

          <Button type="submit" loading={isLoading} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
