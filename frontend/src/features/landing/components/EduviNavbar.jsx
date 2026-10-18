// frontend/src/features/landing/components/EduviNavbar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X, User, LogIn } from "lucide-react";
import BrandMark from "./BrandMark";

/* In-page anchors — each id exists on a section of the landing page. */
const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Subjects", href: "#subjects" },
  { label: "For teachers", href: "#teachers" },
  { label: "Experts", href: "#experts" },
  { label: "Classes", href: "#classes" },
  { label: "FAQ", href: "#faq" },
];

export default function EduviNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(latest > prev && latest > 160);
    setScrolled(latest > 24);
  });

  return (
    <motion.header
      animate={{ y: hidden && !open ? -110 : 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`transition-colors duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-ink-900/90 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="container-wide flex h-20 items-center justify-between sm:h-24">
          <BrandMark />

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden items-center gap-5 lg:flex">
            <Link
              to="/student-login"
              className="text-sm font-semibold text-white/75 transition-colors hover:text-white"
            >
              Student login
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink-900 transition-colors hover:bg-sage-100"
            >
              <LogIn size={15} />
              Teacher login
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-2 rounded-2xl border border-white/10 bg-ink-900 p-4 shadow-2xl lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 border-t border-white/10 pt-3">
              <Link
                to="/student-login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10"
              >
                <User size={16} className="text-sage-300" />
                Student login
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink-900"
              >
                <LogIn size={15} />
                Teacher login
              </Link>
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}