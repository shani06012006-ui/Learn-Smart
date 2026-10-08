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
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="font-display text-base font-extrabold text-navy-950">
              {step === "email" ? "Login with a One-Time Code" : "Enter your code"}
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              {step === "email"
                ? "We'll email a 6-digit code — no password needed."
                : `Sent to ${email}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy-950"
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
              <label className="block text-xs font-bold text-navy-950">
                Email address
              </label>
              <div className="relative mt-2">
                <Mail
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-bold text-white shadow-purple-glow transition hover:bg-purple-600 disabled:opacity-50"
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
              <label className="block text-xs font-bold text-navy-950">
                6-digit code
              </label>
              <div className="relative mt-2">
                <KeyRound
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-center text-lg font-extrabold tracking-[0.4em] text-navy-950 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  autoFocus
                  required
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Check your inbox (or the Daphne terminal in dev mode).
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-bold text-white shadow-purple-glow transition hover:bg-purple-600 disabled:opacity-50"
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
              className="text-[11px] font-semibold text-slate-400 transition hover:text-navy-950"
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}