// frontend/src/features/auth/components/OtpLoginModal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { X, Mail, ArrowRight, KeyRound, Loader2, CheckCircle2 } from "lucide-react";

import {
  useRequestOtpMutation,
  useVerifyOtpMutation,
} from "../../../store/api/realApi";
import { adminCredentialsReceived } from "../../../store/slices/adminAuthSlice";

export default function OtpLoginModal({ open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [requestOtp, { isLoading: sending }] = useRequestOtpMutation();
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();

  const [step, setStep] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);

  const reset = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    try {
      await requestOtp({ email: email.trim().toLowerCase() }).unwrap();
      setStep("code");
    } catch (err) {
      setError(
        err?.data?.error?.detail ||
        err?.data?.detail ||
        "Could not send the code. Try again."
      );
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    if (!code.trim() || code.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    try {
      const result = await verifyOtp({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      }).unwrap();
      dispatch(adminCredentialsReceived(result));

      const role = result.user?.role;
      const dest =
        role === "admin" ? "/admin"
        : role === "teacher" ? "/teacher"
        : role === "student" ? "/student"
        : "/";
      handleClose();
      navigate(dest, { replace: true });
    } catch (err) {
      setError(
        err?.data?.error?.detail ||
        err?.data?.detail ||
        "Invalid or expired code."
      );
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Login with a one-time code"
        className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">
              {step === "email" ? "Login with a One-Time Code" : "Enter your code"}
            </h3>
            <p className="mt-1 text-xs text-ink-500">
              {step === "email"
                ? "We'll email a 6-digit code — no password needed."
                : `Sent to ${email}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-ink-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-3 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-semibold text-coral-700">
            {error}
          </p>
        )}

        {/* Step: email */}
        {step === "email" && (
          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-800">
                Email address
              </label>
              <div className="relative mt-2">
                <Mail
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-ink-100 bg-white pl-9 pr-3 text-sm text-ink-900 outline-none transition focus:border-ink-500 focus:ring-4 focus:ring-sage-200"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink-800 px-5 text-sm font-bold text-white transition hover:bg-ink-700 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send code
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step: code */}
        {step === "code" && (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-800">
                6-digit code
              </label>
              <div className="relative mt-2">
                <KeyRound
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="h-12 w-full rounded-xl border border-ink-100 bg-white pl-9 pr-3 text-center text-lg font-extrabold tracking-[0.4em] text-ink-900 outline-none transition focus:border-ink-500 focus:ring-4 focus:ring-sage-200"
                  autoFocus
                  required
                />
              </div>
              <p className="mt-2 text-xs text-ink-500">
                Check your inbox (or the Daphne terminal in dev mode).
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink-800 px-5 text-sm font-bold text-white transition hover:bg-ink-700 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Verify &amp; sign in
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setError(null); }}
              className="text-xs font-semibold text-ink-500 transition hover:text-ink-800"
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}