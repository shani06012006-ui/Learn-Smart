// frontend/src/features/auth/TeacherOnboardingPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AlertTriangle, CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";

import {
  useAdminLoginMutation,
  useCompleteTeacherOnboardingMutation,
  useValidateTeacherOnboardingMutation,
} from "../../store/api/realApi";
import { adminCredentialsReceived } from "../../store/slices/adminAuthSlice";
import { friendlyAuthError } from "./authErrors";
import FormField from "./components/FormField";

// Server codes meaning the link itself is finished, so the form is pointless.
const DEAD_LINK_CODES = new Set([
  "invalid_link",
  "link_expired",
  "link_used",
  "account_inactive",
]);

const BAR_TONES = ["bg-rose-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];

function readTokenFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  return new URLSearchParams(hash).get("token") || "";
}

function onboardingErrorMessage(err) {
  const data = err?.data || {};
  const detail = data?.error?.detail;
  if (typeof detail === "string" && detail) return detail;
  for (const field of ["new_password", "confirm_password", "token"]) {
    if (Array.isArray(data[field]) && data[field][0]) return data[field][0];
  }
  if (typeof data.detail === "string" && data.detail) return data.detail;
  return friendlyAuthError(err, "Something went wrong. Please try again.");
}

function scorePassword(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

function Shell({ children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sage-100 p-4">
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl ring-1 ring-ink-100 sm:p-8">
        {children}
      </div>
    </div>
  );
}

function PasswordMeter({ value }) {
  if (!value) return null;
  const score = scorePassword(value);
  return (
    <div className="mt-2 flex gap-1.5" aria-label={`Password strength ${score} of 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            score >= i ? BAR_TONES[score - 1] : "bg-ink-100"
          }`}
        />
      ))}
    </div>
  );
}

const primaryButton =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink-800 px-6 text-sm font-bold text-white transition-colors hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-300 disabled:cursor-not-allowed disabled:opacity-60";

export default function TeacherOnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [validateLink] = useValidateTeacherOnboardingMutation();
  const [completeOnboarding] = useCompleteTeacherOnboardingMutation();
  const [signIn] = useAdminLoginMutation();

  // Read once on mount. The state keeps it after the address bar is cleaned.
  const [token] = useState(readTokenFromHash);
  const [phase, setPhase] = useState("checking"); // checking | ready | invalid | done
  const [teacher, setTeacher] = useState(null);
  const [invalidMessage, setInvalidMessage] = useState("");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Remove the token from the address bar and history as soon as it's read.
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Check the link once when the page opens.
  useEffect(() => {
    if (!token) {
      setInvalidMessage(
        "This setup link is incomplete. Open the most recent link from your school's email."
      );
      setPhase("invalid");
      return undefined;
    }
    let cancelled = false;
    validateLink({ token })
      .unwrap()
      .then((res) => {
        if (cancelled) return;
        setTeacher(res);
        setPhase("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setInvalidMessage(onboardingErrorMessage(err));
        setPhase("invalid");
      });
    return () => {
      cancelled = true;
    };
    // validateLink is a stable RTK trigger. Depending only on the token avoids re-checking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (form.password.length < 8) {
      setFormError("Use at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setFormError("The two passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        token,
        new_password: form.password,
        confirm_password: form.confirm,
      }).unwrap();
    } catch (err) {
      setSubmitting(false);
      const message = onboardingErrorMessage(err);
      if (DEAD_LINK_CODES.has(err?.data?.error?.code)) {
        setInvalidMessage(message);
        setPhase("invalid");
      } else {
        setFormError(message);
      }
      return;
    }

    // Password saved. Sign in with it so the teacher lands on their dashboard.
    try {
      const result = await signIn({
        email: teacher.email,
        password: form.password,
        remember_me: false,
      }).unwrap();
      dispatch(adminCredentialsReceived(result));
      navigate("/teacher", { replace: true });
    } catch {
      setSubmitting(false);
      setPhase("done");
    }
  };

  if (phase === "checking") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 size={28} className="animate-spin text-ink-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink-600">Checking your link…</p>
        </div>
      </Shell>
    );
  }

  if (phase === "invalid") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">
            <AlertTriangle size={26} aria-hidden="true" />
          </span>
          <h1 className="font-display text-xl font-semibold text-ink-900">
            This link can&apos;t be used
          </h1>
          <p className="text-sm text-ink-500">{invalidMessage}</p>
          <button type="button" onClick={() => navigate("/login")} className={primaryButton}>
            Back to log in
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === "done") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={26} aria-hidden="true" />
          </span>
          <h1 className="font-display text-xl font-semibold text-ink-900">Password saved</h1>
          <p className="text-sm text-ink-500">
            Log in with your email and the new password you just created.
          </p>
          <button type="button" onClick={() => navigate("/login")} className={primaryButton}>
            Go to log in
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-100 text-ink-700">
          <ShieldCheck size={26} aria-hidden="true" />
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Welcome{teacher?.first_name ? `, ${teacher.first_name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Create a password for{" "}
          <span className="font-semibold text-ink-800">{teacher?.email}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FormField
            id="new_password"
            label="New password"
            type="password"
            name="new_password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="At least 8 characters"
            icon={Lock}
          />
          <PasswordMeter value={form.password} />
        </div>

        <FormField
          id="confirm_password"
          label="Confirm password"
          type="password"
          name="confirm_password"
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          placeholder="Type it again"
          icon={ShieldCheck}
        />

        <p className="text-xs text-ink-500">
          Use at least 8 characters. Avoid words that are easy to guess.
        </p>

        {formError && (
          <p
            role="alert"
            className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700"
          >
            {formError}
          </p>
        )}

        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save password and continue"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-400">
        This link works once. Keep it private.
      </p>
    </Shell>
  );
}