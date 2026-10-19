// frontend/src/features/student/login/sounds.js
//
// Tiny synthesized sound effects (Web Audio) — no audio files to download.
// Every digit plays a note from a pentatonic scale, so tapping a code sounds
// like a little tune and can never sound "wrong".

let ctx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// C major pentatonic over two octaves: digit 0..9 → note
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

function tone(freq, { start = 0, dur = 0.18, type = "sine", gain = 0.07 } = {}) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

export const playKey = (digit) => tone(SCALE[Number(digit)] ?? SCALE[0]);
export const playBack = () => tone(220, { dur: 0.1, type: "triangle", gain: 0.06 });
export const playOops = () => {
  tone(246.94, { dur: 0.18, type: "triangle" });
  tone(196, { start: 0.16, dur: 0.3, type: "triangle" });
};
export const playSuccess = () =>
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(f, { start: i * 0.1, dur: 0.32, gain: 0.08 })
  );