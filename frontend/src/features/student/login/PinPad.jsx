// frontend/src/features/student/login/PinPad.jsx
import { motion } from "framer-motion";
import { Delete, Star } from "lucide-react";

export const PIN_LEN = 6;

/* Every digit has its own colour; the slot it fills takes the same colour. */
const TONES = {
  1: { fill: "#ffc2c2", edge: "#ee9a9a" },
  2: { fill: "#ffd8a8", edge: "#eeb374" },
  3: { fill: "#fff0a6", edge: "#e4cd5e" },
  4: { fill: "#c9f2b5", edge: "#9bd686" },
  5: { fill: "#b5f0dc", edge: "#7fd8b9" },
  6: { fill: "#b8e4ff", edge: "#82c3f0" },
  7: { fill: "#c9d3ff", edge: "#97a6ee" },
  8: { fill: "#dac8ff", edge: "#b69eee" },
  9: { fill: "#ffc9e6", edge: "#ec9ac6" },
  0: { fill: "#b5eef5", edge: "#7bcfdb" },
};
const NEUTRAL = { fill: "#ffffff", edge: "#d3c4ff" };
const WIN = { fill: "#b9f3c8", edge: "#7bd397" };

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

/* ── The six code slots ───────────────────────────────────────── */

export function PinSlots({ pin, reveal, success, calm }) {
  return (
    <div
      role="img"
      aria-label={`${pin.length} of ${PIN_LEN} numbers entered`}
      className="flex justify-center gap-2 sm:gap-3"
    >
      {Array.from({ length: PIN_LEN }).map((_, i) => {
        const digit = pin[i];
        const filled = digit !== undefined;
        const size = "h-14 w-11 sm:h-16 sm:w-12";

        if (!filled) {
          const isNext = i === pin.length;
          return (
            <div
              key={`empty-${i}`}
              className={`${size} rounded-2xl border-[3px] border-dashed transition-colors ${
                isNext
                  ? `border-purple-400 bg-purple-50 ${calm ? "" : "animate-pulse"}`
                  : "border-purple-200 bg-white"
              }`}
            />
          );
        }

        const tone = success ? WIN : TONES[digit];
        return (
          <motion.div
            key={`filled-${i}-${digit}`}
            initial={calm ? false : { scale: 0.5, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 16 }}
            style={{ background: tone.fill, boxShadow: `0 5px 0 ${tone.edge}` }}
            className={`${size} flex items-center justify-center rounded-2xl font-kid text-3xl font-semibold text-navy-950`}
          >
            {reveal ? digit : <Star size={22} className="fill-current" aria-hidden="true" />}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── The keypad ───────────────────────────────────────────────── */

export function Keypad({ onPress, disabled }) {
  return (
    <div role="group" aria-label="Number pad" className="grid grid-cols-3 gap-x-3 gap-y-4">
      {KEYS.map((k) => {
        const isClear = k === "clear";
        const isBack = k === "back";
        const tone = TONES[k] ?? NEUTRAL;

        return (
          <button
            key={k}
            type="button"
            onClick={() => onPress(k)}
            disabled={disabled}
            aria-label={isClear ? "Clear all numbers" : isBack ? "Delete last number" : `Number ${k}`}
            style={{ "--fill": tone.fill, "--edge": tone.edge }}
            className="flex h-[clamp(3.25rem,8vh,4.25rem)] items-center justify-center rounded-3xl bg-[var(--fill)] font-kid text-3xl font-semibold text-navy-950 shadow-[0_6px_0_var(--edge)] transition-[transform,box-shadow] duration-75 hover:-translate-y-0.5 hover:shadow-[0_8px_0_var(--edge)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300 active:translate-y-[5px] active:shadow-[0_1px_0_var(--edge)] disabled:opacity-60"
          >
            {isClear ? (
              <span className="text-base font-semibold text-slate-500">Clear</span>
            ) : isBack ? (
              <Delete size={26} className="text-slate-500" aria-hidden="true" />
            ) : (
              k
            )}
          </button>
        );
      })}
    </div>
  );
}