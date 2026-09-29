import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, GraduationCap } from "lucide-react";

const NAV_LINKS = [
  { label: "Product", to: "#product" },
  { label: "Features", to: "#features" },
  { label: "How It Works", to: "#how" },
  { label: "For Students", to: "#students" },
  { label: "For Teachers", to: "#teachers" },
];

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
        className={`mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 sm:px-6 ${
          scrolled
            ? "border border-white/[0.08] bg-night-800/70 shadow-landing-lg backdrop-blur-xl"
            : "border border-transparent bg-transparent"
        }`}
      >
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <motion.div
            layoutId="brand-logo"
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-blue"
          >
            <GraduationCap size={18} className="text-night-900" strokeWidth={2.5} />
          </motion.div>
          <motion.span
            layoutId="brand-word"
            className="text-lg font-bold tracking-tight text-cream-100"
          >
            Learn<span className="text-brand-400">Smart</span>
          </motion.span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.to}
              className="group relative rounded-full px-3.5 py-2 text-sm font-medium text-muted-300 transition-colors hover:text-cream-100"
            >
              {link.label}
              <span className="absolute inset-x-3.5 -bottom-0.5 h-px scale-x-0 bg-gradient-to-r from-transparent via-brand-400 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-300 transition-colors hover:text-cream-100 sm:block"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="group relative hidden overflow-hidden rounded-full bg-gradient-to-r from-brand-400 to-brand-500 px-5 py-2 text-sm font-semibold text-night-900 shadow-glow-blue transition-all hover:shadow-glow-blue-lg sm:inline-flex"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">Get Started</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-night-800/60 text-cream-100 lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-2 rounded-2xl border border-white/[0.08] bg-night-800/95 p-4 shadow-landing-lg backdrop-blur-xl lg:hidden"
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-300 transition-colors hover:bg-white/5 hover:text-cream-100"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-300 hover:bg-white/5 hover:text-cream-100"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl bg-gradient-to-r from-brand-400 to-brand-500 px-3 py-2.5 text-center text-sm font-semibold text-night-900 shadow-glow-blue"
            >
              Get Started
            </Link>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}