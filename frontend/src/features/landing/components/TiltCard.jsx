import { useRef, useState } from "react";

export default function TiltCard({ children, className = "", intensity = 8 }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rx = (y - 0.5) * -intensity;
    const ry = (x - 0.5) * intensity;
    setStyle({
      transform: `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`,
      boxShadow: "0 24px 60px -20px rgba(255,107,53,0.35)",
    });
  };

  const onLeave = () =>
    setStyle({ transform: "perspective(800px) rotateX(0) rotateY(0)", boxShadow: "" });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: "transform 200ms ease-out, box-shadow 200ms ease-out", ...style }}
      className={className}
    >
      {children}
    </div>
  );
}