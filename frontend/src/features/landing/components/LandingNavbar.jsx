import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X, GraduationCap } from "lucide-react";

// `to` can be a route ("/programs") or an anchor on this page ("#features").
// `route: true` uses <Link>, `route: false` uses <a href>.
const NAV_LINKS = [
  { label: "Home",       to: "#hero",       route: false },
  { label: "Programs",   to: "#features",   route: false },
  { label: "Enterprise", to: "#reach",      route: false },
  { label: "Pricing",    to: "#pricing",    route: false },
  { label: "Portal",     to: "#portal",     route: false },
  { label: "Resources",  to: "#resources",  route: false },
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

  const renderNavItem = (link, onClick, className) => {
    const base = className ?? "group relative rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-navy-900";
    if (link.route) {
      return (
        <Link key={link.label} to={link.to} onClick={onClick} className={base}>
          {link.label}
          {!className && (
            <span className="absolute inset-x-3.5 -bottom-0.5 h-px scale-x-0 bg-gradient-to-r from-transparent via-navy-800 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
          )}
        </Link>
      );
    }
    return (
      <a key={link.label} href={link.to} onClick={onClick} className={base}>
        {link.label}
        {!className && (
          <span className="absolute inset-x-3.5 -bottom-0.5 h-px scale-x-0 bg-gradient-to-r from-transparent via-navy-800 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
        )}
      </a>
    );
  };

  return (
    <motion.header
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 sm:px-6 ${
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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => renderNavItem(link))}
        </nav>

        {/* Right actions */}
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

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-elevated lg:hidden"
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) =>
              renderNavItem(
                link,
                () => setOpen(false),
                "rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy-900"
              )
            )}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-navy-900"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl bg-navy-900 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-navy-glow"
            >
              Register / Get Demo
            </Link>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}