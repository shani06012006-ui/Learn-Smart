// frontend/src/features/auth/SetupPasswordPage.jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Check, X, Loader2, Sparkles, GraduationCap } from "lucide-react";
import { useSetupPasswordMutation } from "../../store/api/realApi";

function CheckRow({ ok, label }) {
  return (
    <div className={`flex items-center gap-2 ${ok ? "text-emerald-600" : "text-slate-500"}`}>
      {ok ? <Check size={16} className="shrink-0" /> : <X size={16} className="shrink-0" />}
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default function SetupPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [setupPassword, { isLoading }] = useSetupPasswordMutation();

  // Password strength rules
  const rules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      return setError("Please fill in both password fields.");
    }
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (!rules.length || !rules.upper || !rules.lower || !rules.number) {
      return setError("Password does not meet the requirements.");
    }

    try {
      await setupPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }).unwrap();

      setSuccess(true);
      // ✅ Redirect to student login (PIN page) after 2 seconds
      setTimeout(() => navigate("/student-login", { replace: true }), 2000);
    } catch (err) {
      const msg =
        err?.data?.error?.detail ||
        (typeof err?.data?.error === "string" ? err.data.error : null) ||
        err?.data?.detail ||
        "Failed to set password. The link may have expired.";
      setError(typeof msg === "string" ? msg : "Something went wrong.");
    }
  };

  // If no token → error page
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <X size={32} />
          </div>
          <h1 className="text-xl font-bold text-navy-950 mb-2">Invalid Link</h1>
          <p className="text-sm text-slate-500 mb-6">
            This setup link is missing a token. Ask your school admin to send a new one.
          </p>
          <button
            onClick={() => navigate("/student-login")}
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-700"
          >
            Go to Student Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1e3a2d] px-4 py-8 flex items-center justify-center">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-12 h-20 w-20 rounded-2xl bg-yellow-400 flex items-center justify-center text-3xl font-black text-yellow-800 rotate-12">C</div>
        <div className="absolute top-32 right-20 h-16 w-16 rounded-2xl bg-emerald-400 flex items-center justify-center text-2xl font-black text-emerald-900 -rotate-6">B</div>
        <div className="absolute bottom-24 left-1/4 h-14 w-14 rounded-2xl bg-pink-300 flex items-center justify-center text-xl font-black text-pink-900 rotate-45">A</div>
        <Sparkles className="absolute bottom-10 right-1/4 text-white/10" size={60} />
      </div>

      {/* Top Nav */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
            <GraduationCap size={20} />
          </div>
          <span className="font-display text-xl font-bold text-white">Learn Smart</span>
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-2xl mt-16"
      >
        {/* Mascot Owl */}
        <div className="absolute -left-12 top-1/4 hidden lg:block">
          <div className="text-[140px] drop-shadow-xl">🦉</div>
        </div>

        <div className="rounded-3xl bg-white/95 p-8 md:p-10 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900">
              Set Your Password
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-600">
              Choose a strong, memorable password to complete your account activation.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex items-start gap-2"
            >
              <X size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-start gap-2"
            >
              <Check size={16} className="shrink-0 mt-0.5" />
              <span>Password saved successfully! Redirecting to login...</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  disabled={success}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 pr-12 text-base outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                disabled={success}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-base outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Show password toggle */}
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
              Show password
            </label>

            {/* Requirements checklist */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Password Requirements
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <CheckRow ok={rules.length} label="At least 8 characters" />
                <CheckRow ok={rules.upper} label="One uppercase letter" />
                <CheckRow ok={rules.lower} label="One lowercase letter" />
                <CheckRow ok={rules.number} label="One number" />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Saving...
                </span>
              ) : success ? (
                <span className="inline-flex items-center gap-2">
                  <Check size={18} /> Saved!
                </span>
              ) : (
                "Set Password and Continue"
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              A strong password helps keep your information safe.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}