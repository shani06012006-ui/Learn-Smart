import { Video, Calendar, Clock } from "lucide-react";

import { useScrollReveal } from "../../../hooks/useScrollReveal";
import Badge from "../../../components/ui/Badge";
import {
  MiniPanel,
  MiniAvatar,
  MiniBadge,
} from "./previewParts";

export default function LiveClassesSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section
      ref={ref}
      className="relative border-t border-ink-200 py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div
            className={
              revealed ? "landing-reveal is-visible" : "landing-reveal"
            }
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Live classes
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Schedule a session.
              <br />
              Students see it instantly.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-500">
              Teachers schedule a live session for a class — title, topic,
              date, time, duration, and an optional meeting link. Every
              enrolled student gets a notification, and the session shows up
              on their Live Classes page with a Join action.
            </p>

            <ul className="mt-6 flex flex-col gap-3 text-sm text-ink-700">
              <Bullet label="Per-class scheduling from the teacher dashboard" />
              <Bullet label="Automatic notifications for every enrolled student" />
              <Bullet label="Status that changes from Upcoming → Live → Completed" />
              <Bullet label="Join view with session details, teacher info, and meeting link" />
            </ul>
          </div>

          <div
            className={
              "space-y-3 " +
              (revealed
                ? "landing-reveal landing-reveal-delay-1 is-visible"
                : "landing-reveal landing-reveal-delay-1")
            }
          >
            <MiniPanel className="p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="success" dot>
                      Live now
                    </Badge>
                    <span className="text-[10px] text-ink-500">
                      Started 5 min ago
                    </span>
                  </div>
                  <p className="truncate text-sm font-semibold text-ink-900">
                    Newton&apos;s Laws — Problem Solving
                  </p>
                  <p className="text-[11px] text-ink-500">
                    Grade 10 Physics · 45 min
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white">
                  Join now
                </span>
              </div>
            </MiniPanel>

            <MiniPanel className="p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="brand" dot>
                      Upcoming
                    </Badge>
                    <span className="text-[10px] text-ink-500">in 2h</span>
                  </div>
                  <p className="truncate text-sm font-semibold text-ink-900">
                    Mid-term Revision
                  </p>
                  <p className="text-[11px] text-ink-500">
                    Grade 10 Physics · 60 min
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={10} />
                      Wed, 24 Sept
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={10} />
                      18:00
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-md border border-ink-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-700">
                  Join
                </span>
              </div>
            </MiniPanel>

            <MiniPanel className="p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <MiniAvatar initials="AI" color="bg-success-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink-900">
                    Anita Iyer
                  </p>
                  <p className="text-[10px] text-ink-500">
                    Teacher · will host this session
                  </p>
                </div>
                <MiniBadge tone="neutral">meet.example.com/…</MiniBadge>
              </div>
            </MiniPanel>

            <div className="flex items-center gap-2 px-1 pt-1 text-xs text-ink-500">
              <Video size={12} />
              <span>Powered by the Live Classes module</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bullet({ label }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
      {label}
    </li>
  );
}
