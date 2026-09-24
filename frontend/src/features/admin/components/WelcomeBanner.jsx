import { useSelector } from "react-redux";

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
    <section className="mb-6 overflow-hidden rounded-card border border-ink-200 bg-gradient-to-r from-brand-50 via-white to-white p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            {greeting}, {displayName}!
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Here&rsquo;s what&rsquo;s happening across{" "}
            <span className="font-medium text-ink-800">
              {user?.institution?.name || "your institution"}
            </span>{" "}
            today.
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
          {formattedDate}
        </p>
      </div>
    </section>
  );
}