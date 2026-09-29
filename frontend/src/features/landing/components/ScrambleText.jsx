import { useEffect, useState } from "react";

const CHARS = "!<>-_\\/[]{}—=+*^?#abcdefghijklmnopqrstuvwxyz";

export default function ScrambleText({ text, className = "", speed = 34, delay = 200 }) {
  const [output, setOutput] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setOutput(text);
      return;
    }

    let raf;
    let frame = 0;
    const queue = text.split("").map((ch, i) => ({
      to: ch,
      start: Math.floor(Math.random() * 12) + i * 2,
      end: Math.floor(Math.random() * 12) + i * 2 + 18,
      char: "",
    }));

    const startTimer = setTimeout(() => setMounted(true), delay);
    const tick = () => {
      let out = "";
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const q = queue[i];
        if (frame >= q.end) {
          complete++;
          out += q.to;
        } else if (frame >= q.start) {
          if (!q.char || Math.random() < 0.28) {
            q.char = CHARS[Math.floor(Math.random() * CHARS.length)];
          }
          out += q.char;
        } else {
          out += " ";
        }
      }
      setOutput(out);
      if (complete < queue.length) {
        frame += 1;
        raf = requestAnimationFrame(tick);
      } else {
        setOutput(text);
      }
    };

    if (mounted) raf = requestAnimationFrame(tick);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [text, delay, mounted]);

  return (
    <span className={className} suppressHydrationWarning>
      {output || "\u00A0"}
    </span>
  );
}