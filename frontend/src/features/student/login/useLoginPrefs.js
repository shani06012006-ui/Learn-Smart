// frontend/src/features/student/login/useLoginPrefs.js
import { useCallback, useState } from "react";

/*
  Device-level comfort settings for the student login screen.
  Grown-ups change them in the "For grown-ups" corner; they are remembered
  in this browser only (nothing is sent to the server).
*/
const KEY = "learnsmart.studentLogin.prefs";

function systemWantsLessMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function load() {
  const defaults = { sound: true, calm: systemWantsLessMotion() };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!saved) return defaults;
    return {
      sound: typeof saved.sound === "boolean" ? saved.sound : defaults.sound,
      calm: typeof saved.calm === "boolean" ? saved.calm : defaults.calm,
    };
  } catch {
    return defaults;
  }
}

export function useLoginPrefs() {
  const [prefs, setPrefs] = useState(load);

  const update = useCallback(
    (patch) => {
      const next = { ...prefs, ...patch };
      setPrefs(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage can be blocked (private mode) — the setting still works until reload */
      }
    },
    [prefs]
  );

  return [prefs, update];
}