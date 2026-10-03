import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X, GraduationCap } from "lucide-react";

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(latest > prev && latest > 120);
    setScrolled(latest > 12);
  });

  return (
    <motion.header
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto mt-3 flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-all duration-300 sm:px-6 ${
          scrolled
            ? "border border-slate-200 bg-white/85 shadow-elevated backdrop-blur-xl"
            : "border border-transparent bg-transparent"
        }`}
      >
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 shadow-navy-glow">
            <GraduationCap size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Edu<span className="text-navy-800">Core</span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-navy-900 sm:block"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="group relative hidden overflow-hidden rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-white shadow-navy-glow transition-all hover:bg-navy-800 sm:inline-flex"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">Register / Get Demo</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — just the actions */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-elevated lg:hidden"
        >
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-navy-900 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-navy-glow"
            >
              Register / Get Demo
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}