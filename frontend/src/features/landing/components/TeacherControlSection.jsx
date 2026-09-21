import {
  BookOpen,
  Upload,
  ClipboardList,
  Megaphone,
  Video,
  BarChart3,
} from "lucide-react";

import { useScrollReveal } from "../../../hooks/useScrollReveal";
import {
  MiniPanel,
  MiniAvatar,
  MiniBadge,
  MiniProgress,
} from "./previewParts";

export default function TeacherControlSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section
      id="teachers"
      ref={ref}
      className="relative border-t border-ink-200 bg-ink-100/40 py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          className={
            "mx-auto max-w-2xl text-center " +
            (revealed ? "landing-reveal is-visible" : "landing-reveal")
          }
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            For teachers
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Give teachers more time to teach.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-500">
            Classes, rosters, materials, quizzes, announcements, and live
            sessions — organised in one dashboard, with performance visible at
            a glance.
          </p>
        </div>

        <div
          className={
            "mx-auto mt-14 max-w-5xl " +
            (revealed
              ? "landing-reveal landing-reveal-delay-1 is-visible"
              : "landing-reveal landing-reveal-delay-1")
          }
        >
          <MiniPanel className="p-4 shadow-xl">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  My classes
                </p>
                <ClassRow name="Grade 10 Physics" subject="Physics" students={2} active />
                <ClassRow name="Grade 10 Chemistry" subject="Chemistry" students={1} />
                <ClassRow name="Grade 9 Physics" subject="Physics" students={0} />
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Roster · Grade 10 Physics
                </p>
                <MiniPanel className="p-3">
                  <ul className="flex flex-col gap-2">
                    <RosterRow initials="RS" name="Rahul Sharma" tone="success" />
                    <RosterRow initials="MN" name="Meera Nair" tone="success" />
                    <RosterRow initials="AM" name="Arjun Mehta" tone="warning" />
                  </ul>
                </MiniPanel>
                <div className="grid grid-cols-2 gap-2">
                  <ActionTile icon={Upload} label="Upload material" />
                  <ActionTile icon={ClipboardList} label="Create quiz" />
                  <ActionTile icon={Megaphone} label="Announcement" />
                  <ActionTile icon={Video} label="Live class" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Class performance
                </p>
                <MiniPanel className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] text-ink-500">Average score</span>
                    <span className="text-sm font-semibold text-ink-900">64%</span>
                  </div>
                  <MiniProgress value={64} variant="brand" />
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <p className="font-semibold text-danger-700">4</p>
                      <p className="text-ink-500">Need support</p>
                    </div>
                    <div>
                      <p className="font-semibold text-success-700">6</p>
                      <p className="text-ink-500">Improving</p>
                    </div>
                  </div>
                </MiniPanel>
                <MiniPanel className="p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-brand-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                      AI insight
                    </p>
                  </div>
                  <p className="text-[11px] leading-snug text-ink-700">
                    Projectile Motion is a difficult topic for most students.
                  </p>
                </MiniPanel>
              </div>
            </div>
          </MiniPanel>
        </div>
      </div>
    </section>
  );
}

function ClassRow({ name, subject, students, active = false }) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 " +
        (active ? "ring-1 ring-brand-300" : "")
      }
    >
      <BookOpen size={14} className="text-brand-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink-900">{name}</p>
        <p className="text-[10px] text-ink-500">
          {subject} · {students} {students === 1 ? "student" : "students"}
        </p>
      </div>
    </div>
  );
}

function RosterRow({ initials, name, tone = "neutral" }) {
  return (
    <li className="flex items-center gap-2">
      <MiniAvatar
        initials={initials}
        color={
          tone === "success"
            ? "bg-success-500"
            : tone === "warning"
            ? "bg-warning-500"
            : "bg-ink-500"
        }
      />
      <span className="min-w-0 flex-1 truncate text-[11px] text-ink-700">
        {name}
      </span>
      <MiniBadge tone={tone}>
        {tone === "warning" ? "Pending" : "Active"}
      </MiniBadge>
    </li>
  );
}

function ActionTile({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-start gap-1.5 rounded-lg border border-ink-200 bg-white p-2.5">
      <Icon size={14} className="text-brand-600" />
      <p className="text-[10px] font-medium leading-tight text-ink-700">
        {label}
      </p>
    </div>
  );
}
