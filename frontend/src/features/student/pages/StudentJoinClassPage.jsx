// frontend/src/features/student/pages/StudentJoinClassPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
} from "lucide-react";

import { useJoinClassWithCodeMutation } from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";
import { getRoleConfig } from "../../../config/roleConfig";

export default function StudentJoinClassPage() {
  const R = getRoleConfig("student");
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [joinClass, { isLoading }] = useJoinClassWithCodeMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setError("Please enter a valid 6-character code.");
      return;
    }

    try {
      await joinClass(cleanCode).unwrap();
      setSuccess(true);
      // Wait 2 seconds so they see the success message, then redirect
      setTimeout(() => {
        navigate("/student/classes");
      }, 2000);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 pt-8">
      <header className="text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          {R.headings?.joinClass?.title || "Join a Class"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {R.headings?.joinClass?.subtitle ||
            "Enter the 6-character code your teacher gave you."}
        </p>
      </header>

      <div className="rounded-2xl border border-gray-100 bg-white/95 p-8 shadow-sm backdrop-blur-md">
        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <h2 className="mt-3 font-display text-lg font-extrabold text-navy-950">
              Successfully Joined!
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Redirecting you to your classes...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-center text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Class Code
              </label>
              <div className="relative mt-2">
                <KeyRound
                  size={20}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError("");
                  }}
                  placeholder="e.g. PHY10X"
                  maxLength={6}
                  autoFocus
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-center font-mono text-2xl font-extrabold uppercase tracking-widest text-navy-950 placeholder:text-slate-300 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || code.trim().length !== 6}
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join Class
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        Don't have a code?{" "}
        <Link
          to="/student"
          className="font-bold text-emerald-600 hover:text-emerald-700"
        >
          Back to Dashboard
        </Link>
      </p>
    </div>
  );
}