// frontend/src/features/admin/components/WelcomeBanner.jsx
import { useSelector } from "react-redux";
import { Sparkles } from "lucide-react";

import { selectAdminUser } from "../../../store/slices/adminAuthSlice";

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function WelcomeBanner() {
  const user = useSelector(selectAdminUser);

  const greeting = getGreeting();
  const formattedDate = getFormattedDate();

  const displayName =
    user?.first_name?.trim() ||
    user?.full_name?.trim() ||
    user?.email ||
    "Admin";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-purple-700 p-6 text-white shadow-elevated sm:p-8">
      {/* Soft glows */}
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-coral-500/10 blur-3xl" />

      {/* Eyebrow */}
      <span className="relative inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80">
        <Sparkles size={11} className="text-electric-300" />
        Learn Smart Platform
      </span>

      <div className="relative mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {greeting}, <span className="text-coral-300">{displayName}</span>!
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            Here&rsquo;s what&rsquo;s happening across Learn Smart today.
          </p>
        </div>
        <p className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur">
          {formattedDate}
        </p>
      </div>
    </section>
  );
}