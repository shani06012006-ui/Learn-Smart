import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Megaphone,
  Trophy,
  Video,
  Bell,
  Sparkles,
} from "lucide-react";

import {
  MiniPanel,
  MiniProgress,
  MiniSparkline,
  MiniAvatar,
  MiniBadge,
  MiniNotificationDot,
} from "./previewParts";

// Renders a static, hand-authored mock of the Learn-Smart dashboard.
// Everything is markup + CSS — nothing is fetched. The purpose is to give
// visitors a realistic sense of what the product looks like in use.

export default function ProductPreview() {
  return (
    <div className="landing-preview relative">
      {/* Soft ambient glow behind the panel */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-200/40 via-brand-100/20 to-transparent blur-2xl"
        aria-hidden="true"
      />

      {/* Main panel */}
      <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl">
        {/* Top chrome bar */}
        <div className="flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success-500/70" />
            <span className="ml-3 hidden text-xs font-medium text-ink-500 sm:inline">
              learn-smart.app
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={14} className="text-ink-500" />
              <span className="absolute -right-1 -top-1">
                <MiniNotificationDot />
              </span>
            </div>
            <MiniAvatar initials="RS" color="bg-brand-500" />
          </div>
        </div>

        {/* Body: mini rail + main content */}
        <div className="flex">
          {/* Mini sidebar rail */}
          <aside className="hidden w-40 shrink-0 border-r border-ink-200 bg-ink-100/40 p-3 sm:block">
            <div className="mb-2 flex items-center gap-2 px-2 py-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-[10px] font-bold text-white">
                LS
              </span>
              <span className="text-xs font-semibold text-ink-900">Learn Smart</span>
            </div>
            <nav className="flex flex-col gap-0.5">
              <RailItem icon={LayoutDashboard} label="Dashboard" active />
              <RailItem icon={BookOpen} label="My Classes" />
              <RailItem icon={FileText} label="Materials" />
              <RailItem icon={Megaphone} label="Announcements" />
              <RailItem icon={Trophy} label="Performance" />
              <RailItem icon={Video} label="Live Classes" />
            </nav>
          </aside>

          {/* Main content */}
          <div className="min-w-0 flex-1 p-4">
            {/* Welcome row */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
                  Student
                </p>
                <p className="text-sm font-semibold text-ink-900">
                  Welcome back, Rahul
                </p>
              </div>
              <MiniBadge tone="success">On track</MiniBadge>
            </div>

            {/* Grid of panels */}
            <div className="grid grid-cols-2 gap-3">
              {/* Progress card */}
              <MiniPanel className="col-span-2 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-ink-700">
                    Overall progress
                  </p>
                  <span className="text-xs font-semibold text-brand-600">78%</span>
                </div>
                <MiniProgress value={78} />
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-ink-500">
                  <div>
                    <p className="font-medium text-ink-700">12</p>
                    <p>Quizzes</p>
                  </div>
                  <div>
                    <p className="font-medium text-ink-700">4</p>
                    <p>Classes</p>
                  </div>
                  <div>
                    <p className="font-medium text-ink-700">86%</p>
                    <p>Accuracy</p>
                  </div>
                </div>
              </MiniPanel>

              {/* Quiz performance */}
              <MiniPanel className="p-3">
                <p className="mb-2 text-xs font-medium text-ink-700">
                  Quiz trend
                </p>
                <MiniSparkline points={[4, 6, 5, 8, 7, 10, 12]} width={110} height={30} />
                <p className="mt-2 text-[10px] text-ink-500">
                  +8% this week
                </p>
              </MiniPanel>

              {/* AI recommendation */}
              <MiniPanel className="relative overflow-hidden p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-brand-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                    AI insight
                  </p>
                </div>
                <p className="text-[11px] leading-snug text-ink-700">
                  Strong in Physics. Revise <span className="font-medium">Motion</span>{" "}
                  before moving on.
                </p>
              </MiniPanel>

              {/* Upcoming live class */}
              <MiniPanel className="col-span-2 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <MiniBadge tone="brand">
                        <Video size={10} />
                        Live class
                      </MiniBadge>
                      <span className="text-[10px] text-ink-500">in 2h</span>
                    </div>
                    <p className="truncate text-xs font-semibold text-ink-900">
                      Newton's Laws — Problem Solving
                    </p>
                    <p className="text-[10px] text-ink-500">
                      Grade 10 Physics · 45 min
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-brand-600 px-2.5 py-1 text-[10px] font-semibold text-white">
                    Join
                  </span>
                </div>
              </MiniPanel>

              {/* Recent material */}
              <MiniPanel className="col-span-2 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-700">
                    <FileText size={12} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-ink-900">
                      Motion Practice Problems
                    </p>
                    <p className="text-[10px] text-ink-500">
                      Uploaded 2 days ago
                    </p>
                  </div>
                  <MiniBadge tone="neutral">PDF</MiniBadge>
                </div>
              </MiniPanel>
            </div>
          </div>
        </div>
      </div>

      {/* Floating side card — notification */}
      <div className="landing-float pointer-events-none absolute -right-4 top-16 hidden w-56 lg:block">
        <MiniPanel className="p-3 shadow-lg">
          <div className="flex items-start gap-2">
            <span className="mt-0.5">
              <MiniNotificationDot />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ink-900">
                New announcement
              </p>
              <p className="line-clamp-2 text-[10px] text-ink-500">
                Quiz on Newton's Laws — Friday. Bring a calculator.
              </p>
            </div>
          </div>
        </MiniPanel>
      </div>

      {/* Floating side card — live badge */}
      <div className="landing-float-slow pointer-events-none absolute -left-4 bottom-12 hidden w-44 lg:block">
        <MiniPanel className="p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <MiniAvatar initials="AI" color="bg-success-500" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ink-900">
                Anita Iyer
              </p>
              <p className="text-[10px] text-ink-500">Teacher · Online</p>
            </div>
          </div>
        </MiniPanel>
      </div>
    </div>
  );
}

function RailItem({ icon: Icon, label, active = false }) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] " +
        (active
          ? "bg-brand-50 text-brand-700"
          : "text-ink-700")
      }
    >
      <Icon size={12} />
      <span>{label}</span>
    </div>
  );
}
