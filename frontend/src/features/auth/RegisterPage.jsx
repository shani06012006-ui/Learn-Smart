// frontend/src/features/auth/RegisterPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";

import {
  useRegisterTeacherMutation,
  useResendRegistrationCodeMutation,
  useVerifyRegistrationMutation,
} from "../../store/api/registrationApi";
import { adminCredentialsReceived } from "../../store/slices/adminAuthSlice";
import { extractFieldErrors } from "../../utils/apiError";
import { friendlyAuthError } from "./authErrors";
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

// Server error codes after which the code can no longer work → start over.
const RESTART_CODES = new Set([
  "too_many_attempts",
  "code_expired",
  "no_pending_registration",
  "email_taken",
]);

const primaryButton =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink-800 px-6 text-sm font-bold text-white transition-colors hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-300 disabled:cursor-not-allowed disabled:opacity-60";

const errorBox =
  "rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700";

// Teacher sign-up, in two steps:
//   1. details  → POST /auth/register/         (a 6-digit code is e-mailed)
//   2. verify   → POST /auth/register/verify/  (account is created and signed in)
export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [registerTeacher, registerState] = useRegisterTeacherMutation();
  const [verifyRegistration, verifyState] = useVerifyRegistrationMutation();
  const [resendCode, resendState] = useResendRegistrationCodeMutation();

  const [step, setStep] = useState("details"); // "details" | "verify"
  const [form, setForm] = useState(initialForm);
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // step 2 state. The token only ever lives here in memory: it proves that
  // THIS browser started the sign-up, so a code alone can't finish it.
  const [pending, setPending] = useState(null); // { email, token }
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Resend countdown
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  /* ── Step 1 ─────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    try {
      const res = await registerTeacher(form).unwrap();
      setPending({ email: res.email, token: res.registration_token });
      setSecondsLeft(res.resend_after ?? 60);
      setCode("");
      setCodeError(null);
      setNotice(null);
      setStep("verify");
    } catch (err) {
      const fields = extractFieldErrors(err);
      setFieldErrors(fields);
      setFormError(Object.keys(fields).length ? null : friendlyAuthError(err));
    }
  };

  /* ── Step 2 ─────────────────────────────────────────────────────── */
  const backToDetails = (message = null) => {
    setStep("details");
    setFormError(message);
    setFieldErrors({});
    setCodeError(null);
    setNotice(null);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setCodeError(null);
    setNotice(null);
    try {
      const result = await verifyRegistration({
        email: pending.email,
        code,
        registration_token: pending.token,
      }).unwrap();
      dispatch(adminCredentialsReceived(result)); // signed in
      navigate("/teacher", { replace: true });
    } catch (err) {
      const serverCode = err?.data?.error?.code;
      const message = friendlyAuthError(err, "That code didn't work. Please try again.");
      if (RESTART_CODES.has(serverCode)) {
        backToDetails(message);
      } else {
        setCodeError(message);
        setCode("");
      }
    }
  };

  const handleResend = async () => {
    setCodeError(null);
    setNotice(null);
    try {
      const res = await resendCode({
        email: pending.email,
        registration_token: pending.token,
      }).unwrap();
      setSecondsLeft(res.resend_after ?? 60);
      setCode("");
      setNotice("We sent you a new code.");
    } catch (err) {
      const retry = err?.data?.error?.retry_after;
      if (retry) setSecondsLeft(retry);
      if (RESTART_CODES.has(err?.data?.error?.code)) {
        backToDetails(friendlyAuthError(err));
      } else {
        setCodeError(friendlyAuthError(err));
      }
    }
  };

  const verifying = step === "verify";
  const busy = registerState.isLoading || verifyState.isLoading || resendState.isLoading;

  return (
    <AuthLayout
      heading={verifying ? "One last step" : "Join Learn Smart"}
      subheading={
        verifying
          ? "We just need to make sure this email address is really yours."
          : "Turn lesson PDFs into quizzes, grade in seconds and keep every class on track."
      }
      title={verifying ? "Check your email" : "Create your account"}
      subtitle={
        verifying ? (
          <>
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-ink-800">{pending?.email}</span>.
          </>
        ) : (
          "It only takes a minute. We'll email you a code to confirm your address."
        )
      }
    >
      {verifying ? (
        /* ───────────────────── Step 2: verify ───────────────────── */
        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label htmlFor="code" className="block text-sm font-semibold text-ink-800">
              Verification code
            </label>
            <input
              id="code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              placeholder="••••••"
              className="mt-2 h-14 w-full rounded-2xl border border-ink-100 bg-white text-center font-display text-2xl font-semibold tracking-[0.5em] text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-ink-500 focus:ring-4 focus:ring-sage-200"
            />
            <p className="mt-2 text-xs text-ink-500">
              The code expires in 15 minutes. Can&apos;t see the email? Check your spam folder.
            </p>
          </div>

          {notice && (
            <p role="status" className="text-sm font-semibold text-emerald-700">
              {notice}
            </p>
          )}
          {codeError && (
            <p role="alert" className={errorBox}>
              {codeError}
            </p>
          )}

          <button type="submit" disabled={busy || code.length !== 6} className={primaryButton}>
            {verifyState.isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Verifying…
              </>
            ) : (
              "Verify and create account"
            )}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
            <button
              type="button"
              onClick={() => backToDetails()}
              className="inline-flex items-center gap-1.5 rounded font-semibold text-ink-500 transition-colors hover:text-ink-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-200"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Use a different email
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={busy || secondsLeft > 0}
              className="rounded font-semibold text-ink-800 underline decoration-ink-200 underline-offset-4 transition-colors hover:decoration-ink-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-200 disabled:cursor-not-allowed disabled:text-ink-400 disabled:no-underline"
            >
              {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
            </button>
          </div>
        </form>
      ) : (
        /* ───────────────────── Step 1: details ───────────────────── */
        <>
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
              placeholder="you@school.edu"
              icon={Mail}
              autoComplete="email"
              required
            />

            {/* Role (public sign-up is for teachers only; students and admins are added by schools) */}
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
                  aria-hidden="true"
                >
                  <path d="m6 8 4 4 4-4" strokeLinecap="round" />
                </svg>
              </div>
            </div>

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
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="font-semibold text-ink-800 underline decoration-ink-200 underline-offset-4 transition-colors hover:decoration-ink-500"
                >
                  Terms &amp; Conditions
                </Link>
              </span>
            </label>

            {/* Field errors from the server */}
            {Object.keys(fieldErrors).length > 0 && (
              <ul className="space-y-1 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-700">
                {Object.entries(fieldErrors).map(([field, msg]) => (
                  <li key={field}>
                    <span className="font-semibold capitalize">{field.replace(/_/g, " ")}: </span>
                    {msg}
                  </li>
                ))}
              </ul>
            )}

            {/* Form-level error */}
            {formError && (
              <p role="alert" className={errorBox}>
                {formError}
              </p>
            )}

            <button type="submit" disabled={busy || !agreed} className={primaryButton}>
              {registerState.isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Sending your code…
                </>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-ink-800 underline decoration-ink-200 underline-offset-4 transition-colors hover:decoration-ink-500"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
