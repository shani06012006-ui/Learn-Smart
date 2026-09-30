import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { GraduationCap, Globe, MessageCircle, Send, Share2 } from "lucide-react";

const SECTIONS = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "#features" },
      { label: "Categories", to: "#categories" },
      { label: "Live Classes", to: "#" },
      { label: "Pricing", to: "#" },
    ],
  },
  {
    title: "For Students",
    links: [
      { label: "Browse Courses", to: "#" },
      { label: "Learning Paths", to: "#" },
      { label: "Certificates", to: "#" },
      { label: "Community", to: "#" },
    ],
  },
  {
    title: "For Teachers",
    links: [
      { label: "Create a Course", to: "#" },
      { label: "Teaching Tools", to: "#" },
      { label: "Analytics", to: "#" },
      { label: "Resources", to: "#" },
    ],
  },
];

const SOCIALS = [
  { icon: Globe, label: "Website" },
  { icon: MessageCircle, label: "Chat" },
  { icon: Send, label: "Telegram" },
  { icon: Share2, label: "Share" },
];

export default function LandingFooter() {
  const footerRef = useRef(null);
  const inView = useInView(footerRef, { once: true, margin: "-100px" });
  return (
    <footer
      ref={footerRef}
      className="relative overflow-hidden border-t border-ink-200 bg-paper-100"
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-7xl px-6 py-16 lg:px-8"
      >
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-indigo">
                <GraduationCap size={18} className="text-night-900" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold tracking-tight text-ink-900">
                Learn<span className="text-brand-500">Smart</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-500">
              The home of your learning journey. Courses, live sessions,
              progress, and community — all in one place.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white/80 text-ink-500 transition-all hover:border-brand-400/40 hover:text-brand-600 hover:shadow-glow-indigo"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">
                {section.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.to}
                      className="text-sm text-ink-600 transition-colors hover:text-brand-600"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-ink-200 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} Learn Smart. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-ink-500">
            <a href="#" className="transition-colors hover:text-brand-600">Privacy</a>
            <a href="#" className="transition-colors hover:text-brand-600">Terms</a>
            <Link to="/login" className="transition-colors hover:text-brand-600">Login</Link>
            <Link to="/register" className="transition-colors hover:text-brand-600">Get Started</Link>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}