import { useEffect, useState } from "react";

export default function CursorGlow() {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  useEffect(() => {
    const onMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] hidden md:block"
      style={{
        background: `radial-gradient(500px circle at ${pos.x}px ${pos.y}px, rgba(46,230,200,0.10), rgba(255,120,84,0.05) 40%, transparent 65%)`,
        transition: "background 100ms linear",
      }}
    />
  );
}