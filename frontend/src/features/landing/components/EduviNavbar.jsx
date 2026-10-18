// frontend/src/features/landing/components/EduviNavbar.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X, ChevronDown, User, LogIn } from "lucide-react";

/* ── Nav links ────────────────────────────────────────────────────
   Empty for now — landing page is single-screen per panel,
   so no in-page anchors needed.
   ────────────────────────────────────────────────────────────── */
const NAV_LINKS = [];

function EduviLogo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Learn Smart home">
      <img
        src="/learn-smart-logo.png"
        alt="Learn Smart"
        className="h-16 w-auto object-contain sm:h-20"
      />
    </Link>
  );
}

export default function EduviNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(latest > prev && latest > 120);
    setScrolled(latest > 12);
  });

  const renderNavItem = (link, onClick, mobile = false) => {
    const base = mobile
      ? "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-950 hover:bg-slate-50"
      : "group inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:text-coral-500";

    const inner = (
      <>
        {link.label}
        {link.dropdown && (
          <ChevronDown
            size={14}
            className={
              mobile
                ? "text-slate-400"
                : "text-slate-400 transition-transform group-hover:translate-y-0.5"
            }
          />
        )}
      </>
    );

    if (link.route) {
      return (
        <Link key={link.label} to={link.href} onClick={onClick} className={base}>
          {inner}
        </Link>
      );
    }
    return (
      <a key={link.label} href={link.href} onClick={onClick} className={base}>
        {inner}
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
        className={`transition-all duration-300 ${
          scrolled
            ? "border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="container-wide flex h-16 items-center justify-between sm:h-20">
          {/* LEFT — logo */}
          <EduviLogo />

          {/* CENTER — desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => renderNavItem(link))}
          </nav>

          {/* RIGHT — Auth buttons (desktop) */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/student-login"
              className="text-sm font-bold text-slate-600 transition-colors hover:text-purple-600"
            >
              Student Login
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/30 transition-all hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-lg"
            >
              <LogIn size={14} />
              Login
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-navy-900 lg:hidden"
            aria-label="Toggle menu"
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
          className="mx-3 mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg lg:hidden"
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) =>
              renderNavItem(link, () => setOpen(false), true)
            )}

            <div className="mt-2 border-t border-gray-100 pt-3">
              <Link
                to="/student-login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <User size={16} className="text-slate-400" />
                Student Login
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                <LogIn size={14} />
                Login
              </Link>
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}