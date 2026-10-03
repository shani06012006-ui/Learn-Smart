// frontend/src/features/landing/components/EduviNavbar.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X, ChevronDown, ShoppingCart, User } from "lucide-react";

/* ── Nav links from the reference ────────────────────────────────── */
const NAV_LINKS = [
  { label: "Shop",            href: "#shop",        dropdown: false },
  { label: "For Kindergarten",href: "#kindergarten", dropdown: true  },
  { label: "For High School", href: "#highschool",   dropdown: true  },
  { label: "For College",     href: "#college",      dropdown: true  },
  { label: "Courses",         href: "#courses",      dropdown: true  },
];

/* ── Eduvi logo — red "M" mark + word ────────────────────────────── */
function EduviLogo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Eduvi home">
      {/* Logo mark — replace with your own image if desired */}
      {/* HERE IS YOUR IMAGE — logo mark — paste a URL over the gradient below */}
      <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-coral-500 to-coral-600 shadow-coral-glow">
        <span className="text-sm font-black leading-none text-white">M</span>
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-navy-950">
        Eduvi
      </span>
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

  return (
    <motion.header
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`transition-all duration-300 ${
          scrolled
            ? "border-b border-slate-200 bg-white/90 shadow-card backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="container-wide flex h-20 items-center justify-between">
          {/* LEFT — logo */}
          <EduviLogo />

          {/* CENTER — desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="group inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:text-coral-500"
              >
                {link.label}
                {link.dropdown && (
                  <ChevronDown
                    size={14}
                    className="text-slate-400 transition-transform group-hover:translate-y-0.5"
                  />
                )}
              </a>
            ))}
          </nav>

          {/* RIGHT — cart + account */}
          <div className="hidden items-center gap-4 lg:flex">
            <a
              href="#cart"
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 transition-colors hover:text-coral-500"
            >
              <ShoppingCart size={16} className="text-coral-500" />
              Cart (0)
            </a>

            <a
              href="#account"
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 transition-colors hover:text-coral-500"
            >
              My Account
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <User size={14} />
              </span>
            </a>
          </div>

          {/* Mobile menu toggle */}
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
          className="mx-3 mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-elevated lg:hidden"
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-900 hover:bg-slate-50"
              >
                {link.label}
                {link.dropdown && <ChevronDown size={14} className="text-slate-400" />}
              </a>
            ))}
            <div className="my-2 h-px bg-slate-100" />
            <a
              href="#cart"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-900 hover:bg-slate-50"
            >
              <ShoppingCart size={16} className="text-coral-500" />
              Cart (0)
            </a>
            <a
              href="#account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-900 hover:bg-slate-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <User size={14} />
              </span>
              My Account
            </a>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}