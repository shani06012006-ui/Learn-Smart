import { Link } from "react-router-dom";
import { GraduationCap, Globe, MessageCircle, Send, Share2, Mail } from "lucide-react";

const SECTIONS = [
  {
    title: "Company",
    links: [
      { label: "About EduCore", to: "#" },
      { label: "Careers", to: "#" },
      { label: "Newsroom", to: "#" },
      { label: "Contact", to: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", to: "#" },
      { label: "API Reference", to: "#" },
      { label: "Case Studies", to: "#" },
      { label: "Blog", to: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "#" },
      { label: "System Status", to: "#" },
      { label: "Security", to: "#" },
      { label: "Accessibility", to: "#" },
    ],
  },
];

const SOCIALS = [
  { icon: Globe, label: "Website" },
  { icon: MessageCircle, label: "Community" },
  { icon: Send, label: "Newsletter" },
  { icon: Share2, label: "Share" },
];

export default function LandingFooter() {
  return (
    <footer className="relative bg-navy-950 text-white">
      {/* Top section */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <GraduationCap size={18} className="text-electric-300" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Edu<span className="text-electric-300">Core</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              A unified institutional LMS for modern universities, colleges, and
              multi-campus networks. Deployed across 42 countries.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-all hover:border-electric-400/40 hover:bg-white/10 hover:text-electric-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/70">
              <Mail size={14} className="text-electric-300" />
              <a href="mailto:hello@educore.example" className="hover:text-white">
                hello@educore.example
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                {section.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.to}
                      className="text-sm text-white/70 transition-colors hover:text-electric-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Contact Info
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li>
                <span className="block text-white/50 text-xs">Global HQ</span>
                Boston · London · Singapore
              </li>
              <li>
                <span className="block text-white/50 text-xs">Sales</span>
                <a href="mailto:sales@educore.example" className="hover:text-electric-300">
                  sales@educore.example
                </a>
              </li>
              <li>
                <span className="block text-white/50 text-xs">Support</span>
                <a href="mailto:support@educore.example" className="hover:text-electric-300">
                  support@educore.example
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar — deeper blue strip */}
      <div className="border-t border-white/10 bg-navy-900">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center lg:px-8">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} EduCore Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-5 text-xs text-white/60">
            <a href="#" className="transition-colors hover:text-electric-300">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-electric-300">Terms of Service</a>
            <a href="#" className="transition-colors hover:text-electric-300">Cookie Settings</a>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}