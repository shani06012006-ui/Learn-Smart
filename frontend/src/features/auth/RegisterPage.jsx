// frontend/src/features/auth/RegisterPage.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Clock,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import {
  useRegisterTeacherMutation,
  useResendRegistrationCodeMutation,
  useVerifyRegistrationMutation,
} from "../../store/api/registrationApi";
import { adminCredentialsReceived } from "../../store/slices/adminAuthSlice";
import { extractFieldErrors } from "../../utils/apiError";
import { friendlyAuthError } from "./authErrors";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  role: "teacher",
  password: "",
  password_confirm: "",
};

const KNOWN_FIELDS = Object.keys(initialForm);

// Server error codes after which the code can no longer work, so the user starts over.
const RESTART_CODES = new Set([
  "too_many_attempts",
  "code_expired",
  "no_pending_registration",
  "email_taken",
]);

/* ── Small pieces ──────────────────────────────────────────────── */

function Field({ id, label, icon: Icon, error, right, ...props }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </label>
      <div
        className={`group relative flex h-12 items-center rounded-2xl border bg-white transition-all focus-within:ring-4 ${
          error
            ? "border-coral-300 ring-coral-100"
            : "border-ink-100 focus-within:border-ink-500 focus-within:ring-sage-200"
        }`}
      >
        {Icon && (
          <Icon
            size={16}
            aria-hidden="true"
            className="ml-4 shrink-0 text-ink-400 transition-colors group-focus-within:text-ink-800"
          />
        )}
        <input
          id={id}
          className={`h-full w-full bg-transparent px-3 text-sm font-medium text-ink-900 outline-none placeholder:text-ink-300 ${
            Icon ? "" : "pl-4"
          }`}
          {...props}
        />
        {right}
      </div>
      {error && <p className="text-xs font-medium text-coral-600">{error}</p>}
    </div>
  );
}

function passwordScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0 to 5
}

const STRENGTH = [
  { label: "Too short", bar: "bg-rose-400" },
  { label: "Weak", bar: "bg-rose-400" },
  { label: "Fair", bar: "bg-amber-400" },
  { label: "Good", bar: "bg-lime-500" },
  { label: "Strong", bar: "bg-emerald-500" },
  { label: "Excellent", bar: "bg-emerald-600" },
];

function StrengthMeter({ password }) {
  if (!password) return null;
  const score = passwordScore(password);
  const level = STRENGTH[score];
  const filled = Math.min(4, Math.ceil((score * 4) / 5));
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < filled ? level.bar : "bg-ink-100"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] font-semibold text-ink-500">Password strength: {level.label}</p>
    </div>
  );
}

function CountdownRing({ seconds, total = 60 }) {
  const r = 8;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(1, seconds / total);
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="-rotate-90" aria-hidden="true">
      <circle cx="10" cy="10" r={r} fill="none" stroke="#e5e7eb" strokeWidth="2" />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        className="transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
    </svg>
  );
}

// Six boxes. Typing advances, Backspace goes back, and a pasted code fills every box.
function OtpInput({ value, onChange, disabled }) {
  const [cells, setCells] = useState(() => Array.from({ length: 6 }, (_, i) => value[i] ?? ""));
  const refs = useRef([]);

  useEffect(() => {
    if (value === "") setCells(Array(6).fill(""));
  }, [value]);

  const emit = (next) => {
    setCells(next);
    onChange(next.join(""));
  };

  const handleChange = (i, raw) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    const next = [...cells];
    digits
      .split("")
      .slice(0, 6 - i)
      .forEach((ch, k) => {
        next[i + k] = ch;
      });
    emit(next);
    refs.current[Math.min(i + digits.length, 5)]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !cells[i] && i > 0) {
      e.preventDefault();
      const next = [...cells];
      next[i - 1] = "";
      emit(next);
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {cells.map((c, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={c}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of 6`}
          autoFocus={i === 0}
          className="h-16 w-full min-w-0 rounded-2xl border border-ink-100 bg-white text-center font-display text-2xl font-bold text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-ink-700 focus:ring-4 focus:ring-sage-200 disabled:opacity-60 sm:h-18 sm:text-3xl"
        />
      ))}
    </div>
  );
}

function Steps({ step }) {
  const items = [
    { id: "details", label: "Your details" },
    { id: "verify", label: "Verify email" },
  ];
  const activeIdx = step === "verify" ? 1 : 0;
  return (
    <ol className="mb-8 flex items-center gap-3">
      {items.map((it, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <li key={it.id} className="flex flex-1 items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                done
                  ? "bg-sage-300 text-ink-900"
                  : active
                    ? "bg-ink-800 text-white ring-4 ring-sage-200"
                    : "bg-ink-100 text-ink-400"
              }`}
            >
              {done ? <Check size={14} /> : i + 1}
            </span>
            <span className={`whitespace-nowrap text-xs font-bold ${active ? "text-ink-900" : "text-ink-400"}`}>
              {it.label}
            </span>
            {i < items.length - 1 && <span className="h-px flex-1 bg-ink-100" />}
          </li>
        );
      })}
    </ol>
  );
}

function Showcase() {
  return (
    <aside className="relative hidden overflow-hidden bg-ink-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(163,201,168,0.28),transparent_45%),radial-gradient(circle_at_85%_90%,rgba(255,255,255,0.08),transparent_40%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]"
      />

      <div className="relative flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-300 text-ink-900">
          <GraduationCap size={22} />
        </span>
        <span className="font-display text-lg font-bold">Learn Smart</span>
      </div>

      <div className="relative">
        <h2 className="font-display text-4xl font-extrabold leading-[1.1] xl:text-5xl">
          Your classroom,{" "}
          <span className="bg-gradient-to-r from-sage-200 to-white bg-clip-text text-transparent">
            on autopilot.
          </span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
          Turn lesson PDFs into quizzes, grade in seconds, and keep every class on track.
        </p>

        <div className="relative mt-10 h-72">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 top-0 flex w-64 items-center gap-3 rounded-2xl bg-white p-4 text-ink-900 shadow-2xl"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-200">
              <FileText size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Fractions-ch4.pdf</p>
              <p className="flex items-center gap-1 text-xs text-ink-500">
                <Check size={12} className="text-emerald-600" /> Quiz generated · 10 questions
              </p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute right-0 top-24 w-60 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Auto-graded</p>
            <p className="mt-1 font-display text-2xl font-bold">
              28 <span className="text-base font-semibold text-white/55">/ 30 submitted</span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "93%" }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
                className="h-full rounded-full bg-sage-200"
              />
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="absolute bottom-0 left-8 w-52 rounded-2xl bg-sage-300 p-4 text-ink-900 shadow-2xl"
          >
            <p className="text-xs font-semibold text-ink-700">Class 5B attendance</p>
            <p className="font-display text-3xl font-bold">94%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-900/15">
              <div className="h-full w-[94%] rounded-full bg-ink-900" />
            </div>
          </motion.div>

          <motion.span
            animate={{ rotate: [0, 12, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-16 bottom-10 text-sage-200"
          >
            <Sparkles size={28} />
          </motion.span>
        </div>
      </div>

      <div className="relative flex items-center gap-3 border-t border-white/10 pt-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-200 text-sm font-bold text-ink-900">
          AI
        </span>
        <div>
          <p className="text-sm font-medium text-white/85">
            &ldquo;I generate a quiz from my lesson PDF in under a minute.&rdquo;
          </p>
          <p className="text-xs text-white/50">Anita Iyer · Teacher, Class 6</p>
        </div>
      </div>
    </aside>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [registerTeacher, registerState] = useRegisterTeacherMutation();
  const [verifyRegistration, verifyState] = useVerifyRegistrationMutation();
  const [resendCode, resendState] = useResendRegistrationCodeMutation();
  const shake = useAnimationControls();

  const [step, setStep] = useState("details"); // "details" | "verify"
  const [form, setForm] = useState(initialForm);
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Step 2. The token lives only in memory: it proves this browser started the sign-up.
  const [pending, setPending] = useState(null); // { email, token }
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const unmappedErrors = Object.entries(fieldErrors).filter(([k]) => !KNOWN_FIELDS.includes(k));
  const mismatch = form.password_confirm && form.password !== form.password_confirm;

  /* ── Step 1 ─────────────────────────────────────────────────── */
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

  /* ── Step 2 ─────────────────────────────────────────────────── */
  const backToDetails = (message = null) => {
    setStep("details");
    setFormError(message);
    setFieldErrors({});
    setCodeError(null);
    setNotice(null);
  };

  const showCodeError = (message) => {
    setCodeError(message);
    shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
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
      dispatch(adminCredentialsReceived(result));
      navigate("/teacher", { replace: true });
    } catch (err) {
      const serverCode = err?.data?.error?.code;
      const message = friendlyAuthError(err, "That code didn't work. Please try again.");
      if (RESTART_CODES.has(serverCode)) {
        backToDetails(message);
      } else {
        showCodeError(message);
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
        showCodeError(friendlyAuthError(err));
      }
    }
  };

  const verifying = step === "verify";
  const busy = registerState.isLoading || verifyState.isLoading || resendState.isLoading;

  return (
    <div className="grid min-h-screen bg-[#f5f7f3] lg:grid-cols-2">
      <Showcase />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sage-200/60 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-ink-100 blur-3xl" />

        <Link
          to="/"
          className="absolute right-6 top-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition-colors hover:text-ink-900 sm:right-10 sm:top-8"
        >
          <ArrowLeft size={15} /> Back to home
        </Link>

        <div className="relative w-full max-w-md">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-800 text-sage-200">
              <GraduationCap size={18} />
            </span>
            <span className="font-display text-base font-bold text-ink-900">Learn Smart</span>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_30px_80px_-30px_rgba(31,41,55,0.25)] ring-1 ring-ink-100 sm:p-10">
            <Steps step={step} />

            <AnimatePresence mode="wait" initial={false}>
              {verifying ? (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-6">
                    <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
                      Check your email
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">
                      We sent a 6-digit code to{" "}
                      <span className="font-semibold text-ink-800">{pending?.email}</span>.
                    </p>
                  </div>

                  <form onSubmit={handleVerify} className="space-y-6">
                    <motion.div animate={shake}>
                      <OtpInput value={code} onChange={setCode} disabled={busy} />
                    </motion.div>

                    <p className="text-center text-xs text-ink-500">
                      The code expires in 15 minutes. Can&apos;t find it? Check your spam folder.
                    </p>

                    {notice && (
                      <p role="status" className="text-center text-sm font-semibold text-emerald-700">
                        {notice}
                      </p>
                    )}
                    {codeError && (
                      <p role="alert" className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-center text-sm font-medium text-coral-700">
                        {codeError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={busy || code.length !== 6}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink-800 text-sm font-bold text-white shadow-lg shadow-ink-900/20 transition-all hover:-translate-y-0.5 hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {verifyState.isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                          Verifying…
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} aria-hidden="true" />
                          Verify and create account
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <button
                        type="button"
                        onClick={() => backToDetails()}
                        className="inline-flex items-center gap-1.5 rounded font-semibold text-ink-500 transition-colors hover:text-ink-900"
                      >
                        <ArrowLeft size={14} aria-hidden="true" /> Different email
                      </button>

                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={busy || secondsLeft > 0}
                        className="inline-flex items-center gap-2 rounded font-semibold text-ink-800 transition-colors hover:text-ink-600 disabled:cursor-not-allowed disabled:text-ink-400"
                      >
                        {secondsLeft > 0 ? (
                          <>
                            <CountdownRing seconds={secondsLeft} />
                            <span className="tabular-nums">Resend in {secondsLeft}s</span>
                          </>
                        ) : (
                          "Resend code"
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-6">
                    <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
                      Create your account
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">
                      It takes about a minute. We&apos;ll email you a code to confirm your address.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        id="first_name"
                        label="First name"
                        name="first_name"
                        icon={User}
                        value={form.first_name}
                        onChange={handleChange}
                        placeholder="Esther"
                        autoComplete="given-name"
                        required
                        error={fieldErrors.first_name}
                      />
                      <Field
                        id="last_name"
                        label="Last name"
                        name="last_name"
                        icon={User}
                        value={form.last_name}
                        onChange={handleChange}
                        placeholder="Howard"
                        autoComplete="family-name"
                        required
                        error={fieldErrors.last_name}
                      />
                    </div>

                    <Field
                      id="email"
                      label="Email"
                      type="email"
                      name="email"
                      icon={Mail}
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@school.edu"
                      autoComplete="email"
                      required
                      error={fieldErrors.email}
                    />

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Account type</span>
                      <div className="flex h-12 items-center gap-3 rounded-2xl border border-sage-300 bg-sage-100/40 px-4 text-sm font-semibold text-ink-800">
                        <Users size={16} aria-hidden="true" />
                        Teacher
                        <span className="ml-auto text-xs font-medium text-ink-500">
                          Students and admins are added by your school
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Field
                        id="password"
                        label="Password"
                        type={showPw ? "text" : "password"}
                        name="password"
                        icon={Lock}
                        value={form.password}
                        onChange={handleChange}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        required
                        error={fieldErrors.password}
                        right={
                          <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            aria-label={showPw ? "Hide password" : "Show password"}
                            className="mr-3 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-800"
                          >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        }
                      />
                      <StrengthMeter password={form.password} />
                    </div>

                    <Field
                      id="password_confirm"
                      label="Confirm password"
                      type={showPw ? "text" : "password"}
                      name="password_confirm"
                      icon={Lock}
                      value={form.password_confirm}
                      onChange={handleChange}
                      placeholder="Type it again"
                      autoComplete="new-password"
                      required
                      error={
                        fieldErrors.password_confirm ||
                        (mismatch ? "Passwords don't match yet." : undefined)
                      }
                      right={
                        form.password_confirm && !mismatch ? (
                          <Check size={16} aria-hidden="true" className="mr-4 text-emerald-600" />
                        ) : null
                      }
                    />

                    <label className="flex cursor-pointer items-start gap-3 pt-1 text-sm text-ink-600">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        required
                        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-md border-2 border-ink-300 accent-ink-800"
                      />
                      <span>
                        I agree to the{" "}
                        <Link to="/terms" className="font-semibold text-ink-800 underline decoration-ink-200 underline-offset-4 hover:decoration-ink-500">
                          Terms &amp; Conditions
                        </Link>
                      </span>
                    </label>

                    {unmappedErrors.length > 0 && (
                      <ul className="space-y-1 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-700">
                        {unmappedErrors.map(([field, msg]) => (
                          <li key={field}>
                            <span className="font-semibold capitalize">{field.replace(/_/g, " ")}: </span>
                            {msg}
                          </li>
                        ))}
                      </ul>
                    )}

                    {formError && (
                      <p role="alert" className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
                        {formError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={busy || !agreed}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink-800 text-sm font-bold text-white shadow-lg shadow-ink-900/20 transition-all hover:-translate-y-0.5 hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {registerState.isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                          Sending your code…
                        </>
                      ) : (
                        <>
                          <Clock size={16} aria-hidden="true" />
                          Continue
                        </>
                      )}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm text-ink-500">
                    Already have an account?{" "}
                    <Link to="/login" className="font-bold text-ink-800 underline decoration-ink-200 underline-offset-4 hover:decoration-ink-500">
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}