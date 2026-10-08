// frontend/src/features/student/StudentLoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Delete, ShieldCheck, Sparkles } from "lucide-react";

import { useStudentPinLoginMutation } from "../../store/api/realApi";
import { adminCredentialsReceived } from "../../store/slices/adminAuthSlice";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];
const PIN_LEN = 6;

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [studentPinLogin, { isLoading }] = useStudentPinLoginMutation();

  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);

  const press = (key) => {
    setError(null);
    if (key === "clear") return setPin("");
    if (key === "back") return setPin((p) => p.slice(0, -1));
    if (pin.length >= PIN_LEN) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LEN) submit(next);
  };

  const submit = async (fullPin) => {
    setError(null);
    try {
      const result = await studentPinLogin({ pin: fullPin }).unwrap();
      dispatch(adminCredentialsReceived(result));
      navigate("/student", { replace: true });
    } catch (err) {
      const msg =
        err?.data?.error?.detail ||
        err?.data?.detail ||
        "Could not sign in with that PIN.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-purple-glow">
            <Sparkles size={26} className="text-white" />
          </span>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">
            Hi there!
          </h1>
          <p className="text-sm text-slate-500">
            Enter your student code to see your progress.
          </p>
        </div>

        {/* PIN boxes */}
        <div
          className={
            "mt-6 flex justify-center gap-2 transition-transform " +
            (shake ? "animate-pulse" : "")
          }
        >
          {Array.from({ length: PIN_LEN }).map((_, i) => (
            <div
              key={i}
              className={
                "flex h-14 w-11 items-center justify-center rounded-2xl border-2 text-2xl font-extrabold tabular-nums transition " +
                (i < pin.length
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-slate-200 bg-slate-50 text-slate-300")
              }
            >
              {pin[i] || "•"}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-center text-sm font-semibold text-coral-700">
            {error}
          </p>
        )}

        {/* Numeric keypad */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {KEYS.map((k) => {
            const isClear = k === "clear";
            const isBack = k === "back";
            return (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                disabled={isLoading}
                className={
                  "flex h-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl font-extrabold text-navy-950 transition active:scale-95 disabled:opacity-50 " +
                  (isClear
                    ? "col-span-1 text-xs text-slate-500"
                    : isBack
                    ? "col-span-1"
                    : "")
                }
              >
                {isClear ? (
                  <span className="text-sm font-bold uppercase tracking-wide">Clear</span>
                ) : isBack ? (
                  <Delete size={22} />
                ) : (
                  k
                )}
              </button>
            );
          })}
        </div>

        {/* Loading / footer */}
        {isLoading && (
          <p className="mt-4 text-center text-xs font-semibold text-slate-400">
            Checking…
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck size={12} />
          <span>Your teacher gave you this code.</span>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-purple-600 hover:text-purple-700"
          >
            I have an email login instead →
          </Link>
        </div>
      </div>
    </div>
  );
}