// frontend/src/features/landing/sections/TrustBand.jsx
import { CalendarDays, Megaphone, Sparkles, UserCheck, Video } from "lucide-react";

/*
  The reference shows a strip of partner logos. We don't have real partners
  yet, so this band lists what the platform itself provides. When you have
  real school / partner logos, swap ITEMS for <img> tags.
*/
const ITEMS = [
  { icon: Sparkles, label: "AI quizzes" },
  { icon: Video, label: "Live classes" },
  { icon: UserCheck, label: "Attendance" },
  { icon: CalendarDays, label: "Timetables" },
  { icon: Megaphone, label: "Announcements" },
];

export default function TrustBand() {
  return (
    <section aria-label="What Learn Smart includes" className="bg-white pb-20 lg:pb-28">
      <div className="container-wide">
        <div className="rounded-l-[2rem] bg-ink-800 px-6 pb-8 pt-6 [clip-path:polygon(0_0,100%_0,95%_100%,0_100%)] sm:px-12">
          <p className="text-center text-xs font-medium text-white/60">
            Everything your classroom runs on, in one place
          </p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 pr-4 sm:justify-between sm:gap-x-6">
            {ITEMS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 font-display text-base font-semibold text-white sm:text-lg"
              >
                <Icon size={20} className="text-sage-300" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}