import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx, ry = my;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      const el = document.elementFromPoint(mx, my);
      setHovering(!!el?.closest("a, button, [data-magnetic], input"));
    };

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
        ringRef.current.style.width = hovering ? "56px" : "32px";
        ringRef.current.style.height = hovering ? "56px" : "32px";
        ringRef.current.style.borderColor = hovering
          ? "rgba(46,230,200,0.9)"
          : "rgba(46,230,200,0.5)";
        ringRef.current.style.boxShadow = hovering
          ? "0 0 20px rgba(46,230,200,0.5)"
          : "0 0 10px rgba(46,230,200,0.25)";
      }
      requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    const raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [hovering]);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[200] hidden h-1.5 w-1.5 rounded-full bg-brand-400 shadow-glow-teal md:block"
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[199] hidden rounded-full border-2 transition-[width,height,border-color,box-shadow] duration-200 md:block"
        style={{ width: 32, height: 32, borderColor: "rgba(46,230,200,0.5)" }}
      />
    </>
  );
}