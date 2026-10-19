// frontend/src/features/student/StudentLoginPage.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Eye, EyeOff, GraduationCap, ShieldCheck, Users, Volume2, VolumeX } from "lucide-react";

import { useStudentPinLoginMutation } from "../../store/api/realApi";
import { adminCredentialsReceived } from "../../store/slices/adminAuthSlice";

import PlayBackground from "./login/PlayBackground";
import HootOwl from "./login/HootOwl";
import { Keypad, PinSlots, PIN_LEN } from "./login/PinPad";
import GrownUpsCorner from "./login/GrownUpsCorner";
import { useLoginPrefs } from "./login/useLoginPrefs";
import { playBack, playKey, playOops, playSuccess } from "./login/sounds";

const PILL =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white/95 font-kid font-semibold text-navy-900 shadow-[0_4px_0_#cdbcff] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 active:translate-y-[3px] active:shadow-[0_1px_0_#cdbcff]";

function celebrate() {
  const colors = ["#7c3aed", "#ff9f1c", "#51cf66", "#4dabf7", "#ff6b9d", "#ffd43b"];
  const base = { colors, disableForReducedMotion: true, zIndex: 60 };
  confetti({ ...base, particleCount: 90, spread: 80, origin: { x: 0.5, y: 0.62 } });
  setTimeout(() => confetti({ ...base, particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }), 200);
  setTimeout(() => confetti({ ...base, particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }), 350);
}

function hootSays(mood, pinLength) {
  switch (mood) {
    case "happy":
      return "Yay! Welcome back! Let's go learn!";
    case "thinking":
      return "Checking your code…";
    case "oops":
      return "Oops! That code didn't work. Let's try again!";
    case "typing": {
      const left = PIN_LEN - pinLength;
      return left === 1 ? "Almost there! Just one more!" : `Great! ${left} more to go.`;
    }
    default:
      return "Hi! I'm Hoot. Tap your 6-number code to start!";
  }
}

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [studentPinLogin, { isLoading }] = useStudentPinLoginMutation();
  const [prefs, updatePrefs] = useLoginPrefs();

  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [hop, setHop] = useState(0);
  const [reveal, setReveal] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const redirectTimer = useRef(null);
  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const mood = success
    ? "happy"
    : isLoading
    ? "thinking"
    : error
    ? "oops"
    : pin.length > 0
    ? "typing"
    : "idle";

  /* ── Sign in (same API + redirect as before) ─────────────────── */
  const submit = async (fullPin) => {
    setError(null);
    try {
      const result = await studentPinLogin({ pin: fullPin }).unwrap();
      dispatch(adminCredentialsReceived(result));
      setSuccess(true);
      if (prefs.sound) playSuccess();
      if (!prefs.calm) celebrate();
      // Short pause so Hoot can celebrate before the dashboard opens
      redirectTimer.current = setTimeout(
        () => navigate("/student", { replace: true }),
        prefs.calm ? 400 : 1400
      );
    } catch (err) {
      const msg =
        err?.data?.error?.detail ||
        err?.data?.detail ||
        "Could not sign in with that PIN.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      setShakeKey((k) => k + 1);
      if (prefs.sound) playOops();
      setPin("");
    }
  };

  const press = (key) => {
    if (isLoading || success || sheetOpen) return;
    setError(null);
    if (key === "clear") {
      setPin("");
      if (prefs.sound) playBack();
      return;
    }
    if (key === "back") {
      setPin((p) => p.slice(0, -1));
      if (prefs.sound) playBack();
      return;
    }
    if (pin.length >= PIN_LEN) return;
    const next = pin + key;
    setPin(next);
    setHop((h) => h + 1);
    if (prefs.sound) playKey(key);
    if (next.length === PIN_LEN) submit(next);
  };

  // Physical keyboard: 0-9, Backspace, Delete / Esc = clear
  const pressRef = useRef(press);
  useEffect(() => {
    pressRef.current = press;
  });
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) pressRef.current(e.key);
      else if (e.key === "Backspace") pressRef.current("back");
      else if (e.key === "Delete" || e.key === "Escape") pressRef.current("clear");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans">
      <PlayBackground calm={prefs.calm} />

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link to="/" className={`${PILL} py-1.5 pl-1.5 pr-4 text-base`} aria-label="Learn Smart home">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500 text-white">
            <GraduationCap size={20} aria-hidden="true" />
          </span>
          Learn Smart
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => updatePrefs({ sound: !prefs.sound })}
            aria-pressed={prefs.sound}
            aria-label={prefs.sound ? "Turn sounds off" : "Turn sounds on"}
            className={`${PILL} h-11 w-11 justify-center`}
          >
            {prefs.sound ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={`${PILL} h-11 px-4 text-sm`}
          >
            <Users size={18} aria-hidden="true" />
            <span className="hidden sm:inline">For grown-ups</span>
            <span className="sm:hidden">Grown-ups</span>
          </button>
        </div>
      </header>

      {/* Main stage */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-5 px-4 pb-10 pt-24 lg:flex-row lg:gap-16 lg:pt-20">
        {/* Hoot + speech bubble */}
        <div className="flex w-full max-w-[30rem] items-end gap-4 lg:w-auto lg:max-w-none lg:flex-col-reverse lg:items-center lg:gap-4">
          <HootOwl
            mood={mood}
            hop={hop}
            calm={prefs.calm}
            className="w-28 shrink-0 sm:w-32 lg:w-[19rem]"
          />
          <div role="status" aria-live="polite" className="relative mb-6 max-w-[16rem] lg:mb-0 lg:max-w-[18rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={hootSays(mood, pin.length)}
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="rounded-3xl bg-white px-5 py-3 font-kid text-lg font-medium leading-snug text-navy-900 shadow-[0_5px_0_#cdbcff]"
              >
                {hootSays(mood, pin.length)}
              </motion.p>
            </AnimatePresence>
            <span
              aria-hidden="true"
              className="absolute -left-1.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-white lg:left-1/2 lg:top-auto lg:-bottom-1.5 lg:-translate-x-1/2 lg:translate-y-0"
            />
          </div>
        </div>

        {/* Login card */}
        <section className="w-full max-w-[30rem] rounded-[2.5rem] bg-white p-5 shadow-[0_10px_0_#cdbcff,0_34px_60px_-24px_rgba(60,30,140,0.55)] ring-4 ring-white/70 sm:p-7">
          <div className="text-center">
            <h1 className="font-kid text-3xl font-semibold text-navy-950">Hi there!</h1>
            <p className="mt-1 text-sm text-slate-500">Enter your student code to see your progress.</p>
          </div>

          <motion.div
            key={shakeKey}
            initial={false}
            animate={{ x: shakeKey > 0 && !prefs.calm ? [0, -10, 10, -8, 8, 0] : 0 }}
            transition={{ duration: 0.45 }}
            className="mt-6"
          >
            <PinSlots pin={pin} reveal={reveal} success={success} calm={prefs.calm} />
          </motion.div>

          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-pressed={!reveal}
            className="mx-auto mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300"
          >
            {reveal ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
            {reveal ? "Hide my code" : "Show my code"}
          </button>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-2.5 text-center text-sm font-semibold text-coral-700"
            >
              {error}
            </p>
          )}

          <div className="mt-5">
            <Keypad onPress={press} disabled={isLoading || success} />
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={13} aria-hidden="true" />
            <span>Your teacher gave you this code.</span>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 focus-visible:outline-none focus-visible:underline"
            >
              I have an email login instead →
            </Link>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {sheetOpen && (
          <GrownUpsCorner
            key="grown-ups"
            onClose={() => setSheetOpen(false)}
            prefs={prefs}
            onChangePrefs={updatePrefs}
          />
        )}
      </AnimatePresence>
    </div>
  );
}