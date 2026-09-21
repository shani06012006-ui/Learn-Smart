import {
  BookOpen,
  Upload,
  ClipboardList,
  Megaphone,
  Video,
  BarChart3,
  ArrowDown,
} from "lucide-react";

import LearningScene, { useSceneReveal } from "./LearningScene";
import {
  MiniPanel,
  MiniAvatar,
  MiniBadge,
  MiniProgress,
} from "./previewParts";

export default function TeacherConnectionScene() {
  const { ref, revealed } = useSceneReveal();

  return (
    <LearningScene
      id="teachers"
      tone="muted"
      eyebrow="For teachers"
      title="Give teachers more time to teach."
      subtitle="Classes, rosters, materials, quizzes, announcements, and live sessions — organised in one dashboard."
      full
    >
      <div ref={ref} className="mx-auto max-w-5xl">
        <div
          className={
            "transition-all duration-700 " +
            (revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")
          }
        >
          <MiniPanel className="p-4 shadow-xl md:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Column 1 — classes */}
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  My classes
                </p>
                <ClassRow name="Grade 10 Physics" subject="Physics" students={2} active />
                <ClassRow name="Grade 10 Chemistry" subject="Chemistry" students={1} />
                <ClassRow name="Grade 9 Physics" subject="Physics" students={0} />
              </div>

              {/* Column 2 — roster + quick actions */}
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

              {/* Column 3 — class performance */}
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

          {/* Connection hint below the dashboard */}
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <div className="flex h-8 items-center justify-center">
              <ArrowDown size={18} className="text-ink-300" />
            </div>
            <p className="max-w-md text-xs text-ink-500">
              Every quiz, submission, and interaction flows into this view —
              so teachers see where help is needed without asking.
            </p>
          </div>
        </div>
      </div>
    </LearningScene>
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
