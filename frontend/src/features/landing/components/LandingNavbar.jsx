import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Menu, X } from "lucide-react";
import clsx from "clsx";

import Button from "../../../components/ui/Button";
import { useScrolled } from "../../../hooks/useScrolled";

// In-page anchors use `href`. Route-based links use `to`.
const NAV_LINKS = [
  { label: "Product", href: "#hero" },
  { label: "Features", to: "/features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "For Students", href: "#students" },
  { label: "For Teachers", href: "#teachers" },
  { label: "Why Learn-Smart", href: "#why" },
];

export default function LandingNavbar() {
  const scrolled = useScrolled(24);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll while mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleNavigate = () => setMobileOpen(false);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-ink-200 bg-white/80 backdrop-blur-md"
          : "border-b border-transparent bg-white/40 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
        <div
          className={clsx(
            "flex items-center transition-all duration-300",
            scrolled ? "h-14" : "h-16"
          )}
        >
          <Link
            to="/"
            className="focus-ring flex items-center gap-2 rounded-md text-ink-900"
            aria-label="Learn Smart home"
          >
            <GraduationCap size={20} className="text-brand-600" />
            <span className="font-semibold">Learn Smart</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) =>
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100/60 hover:text-ink-900"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100/60 hover:text-ink-900"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="focus-ring rounded-md p-2 text-ink-700 hover:bg-ink-100 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div className="border-t border-ink-200 bg-white px-6 pb-6 pt-4">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) =>
                link.to ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={handleNavigate}
                    className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={handleNavigate}
                    className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
                  >
                    {link.label}
                  </a>
                )
              )}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/login" onClick={handleNavigate}>
                <Button variant="secondary" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/register" onClick={handleNavigate}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

