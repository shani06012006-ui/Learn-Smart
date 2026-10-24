// frontend/src/features/auth/ActivateAccountPage.jsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { CheckCircle2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import {
  useCompleteActivationMutation,
  useRequestActivationLinkMutation,
  useValidateActivationMutation,
} from "../../store/api/activationApi";
import { adminCredentialsReceived } from "../../store/slices/adminAuthSlice";
import { friendlyAuthError } from "./authErrors";
import AuthLayout from "./components/AuthLayout";
import FormField from "./components/FormField";

const ROLE_HOME = { admin: "/admin", teacher: "/teacher", student: "/student" };

const PRIMARY_BUTTON =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink-800 px-6 text-sm font-bold text-white transition-colors hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-300 disabled:cursor-not-allowed disabled:opacity-60";

// The link looks like  /activate#token=XXXX . The token is in the URL *fragment*,
// which the browser never sends to any server (so it stays out of server logs).
function readTokenFromHash(hash) {
  try {
    return new URLSearchParams((hash || "").replace(/^#/, "")).get("token") || "";
  } catch {
    return "";
  }
}

// Link problems the server names with a `code`; anything without one is a network/server fault.
function problemFrom(err) {
  return {
    code: err?.data?.error?.code || null,
    message: friendlyAuthError(err, "We couldn't check your link. Please try again."),
  };
}

// { field: ["message", ...] } from a DRF validation error, or {}.
function fieldErrorsFrom(err) {
  const detail = err?.data?.error?.detail;
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) return {};
  return Object.fromEntries(
    Object.entries(detail).map(([field, msgs]) => [field, Array.isArray(msgs) ? msgs : [String(msgs)]]),
  );
}

function strengthOf(pw) {
  if (!pw) return { score: 0, label: "", tone: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "Too weak", tone: "bg-rose-500" },
    { label: "Weak", tone: "bg-rose-500" },
    { label: "Fair", tone: "bg-amber-500" },
    { label: "Good", tone: "bg-lime-500" },
    { label: "Strong", tone: "bg-emerald-500" },
  ];
  return { score: s, ...map[s] };
}

function StrengthMeter({ password }) {
  if (!password) return null;
  const { score, label, tone } = strengthOf(password);
  return (
    <div aria-live="polite">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${score >= i ? tone : "bg-ink-100"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs font-semibold text-ink-500">Password strength: {label}</p>
    </div>
  );
}

function ErrorLines({ messages }) {
  if (!messages?.length) return null;
  return (
    <p role="alert" className="mt-2 text-xs font-medium text-coral-700">
      {messages.join(" ")}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  "Request a new link" (shown when the link is bad / expired)        */
/* ------------------------------------------------------------------ */
function RequestNewLink() {
  const [requestLink, { isLoading }] = useRequestActivationLinkMutation();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await requestLink(email.trim()).unwrap();
      setNotice(res?.detail || "If that e-mail is waiting to be set up, we've sent a new link.");
    } catch (err) {
      setError(friendlyAuthError(err, "We couldn't send a new link. Please try again."));
    }
  };

  if (notice) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-sage-200 bg-sage-100 px-4 py-3 text-sm text-ink-800"
      >
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-sage-600" aria-hidden="true" />
        <span>{notice} Check your inbox (and spam folder), then open the newest link.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        id="request-email"
        label="Your e-mail"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        icon={Mail}
      />
      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700"
        >
          {error}
        </p>
      )}
      <button type="submit" disabled={isLoading || !email.trim()} className={PRIMARY_BUTTON}>
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          "Send me a new link"
        )}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function ActivateAccountPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = readTokenFromHash(location.hash);

  const [validateActivation] = useValidateActivationMutation();
  const [completeActivation, completeState] = useCompleteActivationMutation();

  // 'checking' -> 'form' | 'invalid'
  const [phase, setPhase] = useState(token ? "checking" : "invalid");
  const [info, setInfo] = useState(null); // { first_name, email_hint }
  const [problem, setProblem] = useState(null); // { code, message }

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Step "System validates the activation token". Does not use the link up.
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    validateActivation(token)
      .unwrap()
      .then((data) => {
        if (cancelled) return;
        setInfo(data);
        setPhase("form");
      })
      .catch((err) => {
        if (cancelled) return;
        setProblem(problemFrom(err));
        setPhase("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token, validateActivation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Quick checks so the student gets instant feedback; the server checks again.
    if (newPassword.length < 8) {
      setFieldErrors({ new_password: ["Use at least 8 characters."] });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirm_password: ["Passwords do not match."] });
      return;
    }

    try {
      const result = await completeActivation({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }).unwrap();
      // Password saved, link used up, student signed in -> straight to their dashboard.
      dispatch(adminCredentialsReceived(result));
      navigate(ROLE_HOME[result.user?.role] || "/student", { replace: true });
    } catch (err) {
      const code = err?.data?.error?.code;
      const fields = fieldErrorsFrom(err);
      if (Object.keys(fields).length > 0) {
        // Mismatch / weak password: the link is still good, let them retry.
        setFieldErrors(fields);
      } else if (code) {
        // The link itself went bad meanwhile (expired, used, ...).
        setProblem(problemFrom(err));
        setPhase("invalid");
      } else {
        setFormError(friendlyAuthError(err, "We couldn't save your password. Please try again."));
      }
    }
  };

  /* ---- checking ---- */
  if (token && phase === "checking") {
    return (
      <AuthLayout
        heading="Welcome to Learn Smart"
        subheading="Just a moment while we check your link."
        title="Checking your link…"
      >
        <div role="status" className="flex items-center gap-3 text-sm text-ink-500">
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          One moment please
        </div>
      </AuthLayout>
    );
  }

  /* ---- invalid / expired / used / missing ---- */
  if (!token || phase === "invalid") {
    const code = problem?.code;
    const message = !token
      ? "Open the link from your activation e-mail or message to set your password."
      : problem?.message;

    return (
      <AuthLayout
        heading="Let's get you set up"
        subheading="Your school created your account. Choose a password to start learning."
        title={code === "already_activated" ? "You're already set up" : "This link can't be used"}
        subtitle={message}
      >
        {code === "already_activated" ? (
          <Link to="/login" className={PRIMARY_BUTTON}>
            Go to log in
          </Link>
        ) : code === "account_inactive" ? (
          <p className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
            Please contact your school to reactivate your account.
          </p>
        ) : code ? (
          <>
            <RequestNewLink />
            <p className="mt-6 text-center text-sm text-ink-500">
              Remember your password?{" "}
              <Link to="/login" className="font-bold text-ink-800 underline underline-offset-4">
                Log in
              </Link>
            </p>
          </>
        ) : (
          // No code = we never got an answer (network / server problem), or there is no token.
          <>
            {token ? (
              <button type="button" onClick={() => window.location.reload()} className={PRIMARY_BUTTON}>
                Try again
              </button>
            ) : (
              <RequestNewLink />
            )}
            <p className="mt-6 text-center text-sm text-ink-500">
              <Link to="/login" className="font-bold text-ink-800 underline underline-offset-4">
                Back to log in
              </Link>
            </p>
          </>
        )}
      </AuthLayout>
    );
  }

  /* ---- mandatory password setup ---- */
  const busy = completeState.isLoading;

  return (
    <AuthLayout
      heading="Welcome to Learn Smart"
      subheading="Choose a password to finish setting up your account."
      title={info?.first_name ? `Welcome, ${info.first_name}!` : "Welcome!"}
      subtitle={`Choose a password for ${info?.email_hint || "your account"}. You'll use it every time you log in.`}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <FormField
            id="new_password"
            label="New password"
            type="password"
            name="new_password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            icon={Lock}
          />
          <ErrorLines messages={fieldErrors.new_password} />
        </div>

        <StrengthMeter password={newPassword} />

        <div>
          <FormField
            id="confirm_password"
            label="Confirm password"
            type="password"
            name="confirm_password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Type it again"
            icon={ShieldCheck}
          />
          <ErrorLines messages={fieldErrors.confirm_password} />
        </div>

        <p className="text-xs text-ink-400">
          Use at least 8 characters. Avoid common passwords and your own name or e-mail.
        </p>

        {formError && (
          <p
            role="alert"
            className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700"
          >
            {formError}
          </p>
        )}

        <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save password and continue"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already set a password?{" "}
        <Link to="/login" className="font-bold text-ink-800 underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
