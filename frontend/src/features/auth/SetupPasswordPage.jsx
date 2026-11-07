import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSetupPasswordMutation } from "../../store/api/realApi";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";

export default function SetupPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [setupPassword, { isLoading }] = useSetupPasswordMutation();

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      await setupPassword({ 
        uid,
        token, 
        new_password: newPassword, 
        confirm_password: confirmPassword 
      }).unwrap();
      setSuccess(true);
      // Invalidate existing credentials/tokens and redirect to login
      setTimeout(() => navigate("/login?setup=success"), 3000);
    } catch (err) {
      setError(err?.data?.error || "Failed to set password. The link may be expired or invalid.");
    }
  };


    if (!uid || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
        <div className="max-w-md rounded-3xl bg-white p-10 shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Lock size={30} />
          </div>
          <h1 className="text-xl font-extrabold text-navy-950">Invalid or Expired Link</h1>
          <p className="mt-2 text-sm text-slate-500">
            This password setup link is missing or has expired. Please contact your school administrator to request a new activation link.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 inline-flex items-center font-bold text-purple-600 hover:text-purple-700"
          >
            Go to login page →
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-extrabold text-navy-950">Set Your Password</h1>
        <p className="mb-6 text-sm text-slate-500">Welcome to Learn Smart! Please create a secure password to continue.</p>

        {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600">
            <CheckCircle2 size={16} /> Password set! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
            </div>
          </div>
          <button type="submit" disabled={isLoading}
            className="flex w-full items-center justify-center rounded-xl bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-700">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Save Password"}
          </button>
        </form>
      </div>
    </div>
  );
}