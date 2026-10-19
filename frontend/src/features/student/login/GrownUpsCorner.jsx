// frontend/src/features/student/login/GrownUpsCorner.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, ShieldCheck, Volume2, Wind, X } from "lucide-react";

/*
  A bottom sheet for parents / carers.
  1. A small maths question keeps little fingers out (a "parent gate").
  2. Once solved: how to sign in, device settings, and what keeps kids safe.

  Settings are stored on THIS device only (see useLoginPrefs).
*/

function makeQuestion() {
  const a = 6 + Math.floor(Math.random() * 4); // 6–9
  const b = 6 + Math.floor(Math.random() * 4);
  const answer = a * b;
  const options = new Set([answer]);
  while (options.size < 4) {
    const delta = (1 + Math.floor(Math.random() * 6)) * (Math.random() < 0.5 ? -1 : 1);
    if (answer + delta > 0) options.add(answer + delta);
  }
  return { text: `${a} × ${b}`, answer, options: [...options].sort(() => Math.random() - 0.5) };
}

function Toggle({ icon: Icon, label, hint, checked, onChange }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-navy-950">{label}</p>
        <p className="text-xs leading-snug text-slate-500">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300 ${
          checked ? "bg-purple-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function GrownUpsCorner({ onClose, prefs, onChangePrefs }) {
  const [question, setQuestion] = useState(makeQuestion);
  const [unlocked, setUnlocked] = useState(false);
  const [missed, setMissed] = useState(false);
  const closeRef = useRef(null);

  // Focus the close button on open; Esc closes
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const answer = (value) => {
    if (value === question.answer) {
      setUnlocked(true);
    } else {
      setMissed(true);
      setQuestion(makeQuestion());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <motion.div
        className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="For grown-ups"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300"
        >
          <X size={18} />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {!unlocked ? (
            <motion.div
              key="gate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <Lock size={26} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-kid text-2xl font-semibold text-navy-950">Grown-ups only</h2>
              <p className="mt-1 text-sm text-slate-500">
                {missed ? "Not quite — here is a new one." : "Please solve this to continue."}
              </p>
              <p className="mt-6 font-kid text-4xl font-semibold text-navy-950">{question.text} = ?</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {question.options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => answer(o)}
                    className="h-14 rounded-2xl border-2 border-purple-100 bg-white font-kid text-2xl font-semibold text-navy-950 transition hover:border-purple-400 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300"
                  >
                    {o}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="pr-10 font-kid text-2xl font-semibold text-navy-950">For grown-ups</h2>
              <p className="mt-1 text-sm text-slate-500">Help your child sign in and tune this screen.</p>

              <h3 className="mt-6 text-sm font-bold text-navy-950">Helping your child sign in</h3>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">1</span>
                  Find the 6-number code your child's teacher gave them.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">2</span>
                  Tap the numbers on the screen, or type them on a keyboard.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">3</span>
                  Lost the code? Ask the teacher or the school office for a new one.
                </li>
              </ol>

              <h3 className="mt-7 text-sm font-bold text-navy-950">Comfort settings on this device</h3>
              <div className="mt-3 space-y-3">
                <Toggle
                  icon={Volume2}
                  label="Sound effects"
                  hint="Each number plays a soft musical note."
                  checked={prefs.sound}
                  onChange={(v) => onChangePrefs({ sound: v })}
                />
                <Toggle
                  icon={Wind}
                  label="Calm mode"
                  hint="Stops the moving background, bouncing and confetti."
                  checked={prefs.calm}
                  onChange={(v) => onChangePrefs({ calm: v })}
                />
              </div>

              <h3 className="mt-7 text-sm font-bold text-navy-950">Safe by design</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {[
                  "Teachers or school admins create every student account.",
                  "Students sign in with a code, so no personal email is needed.",
                  "No ads, no external links and no tracking.",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-5 text-sm font-semibold">
                <Link to="/login" className="text-purple-600 hover:text-purple-700">
                  Teacher or admin login →
                </Link>
                <Link to="/" className="text-slate-500 hover:text-navy-950">
                  Back to home
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}