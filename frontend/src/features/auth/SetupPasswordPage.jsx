// frontend/src/features/auth/SetupPasswordPage.jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useSetupPasswordMutation } from "../../store/api/realApi";

export default function SetupPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [setupPassword, { isLoading }] = useSetupPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (newPassword.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    try {
      await setupPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }).unwrap();
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err?.data?.error || "Failed to set password. The link may be expired or used.");
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
          <AlertCircle size={40} className="mx-auto text-rose-500 mb-3" />
          <h1 className="text-xl font-bold text-navy-950 mb-2">Invalid Link</h1>
          <p className="text-sm text-slate-500">This setup link is missing a token. Ask your school admin for a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-extrabold text-navy-950">Set Your Password</h1>
        <p className="mb-6 text-sm text-slate-500">Welcome to Learn Smart! Create a secure password to continue.</p>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600 border border-rose-100">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={16} /> Password set! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className="flex w-full items-center justify-center rounded-xl bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Save Password"}
          </button>
        </form>
      </div>
    </div>
  );
}