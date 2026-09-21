import {
  Compass,
  FolderOpen,
  PenLine,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

// Two-column: text on the right, a composed mockup on the left. Distinct
// from the landing page's alternating layouts because the mockup here is
// a "stack of real UI fragments" rather than a single preview card.

const STUDENT_FEATURES = [
  {
    icon: Users,
    label: "Join a class",
    body: "Enter a teacher's joining code once and the class -- and everything inside it -- becomes available.",
  },
  {
    icon: FolderOpen,
    label: "Materials",
    body: "Open notes, PDFs, and practice sets the teacher shares. Each material has a detail view with type, size, and uploader.",
  },
  {
    icon: PenLine,
    label: "Quizzes",
    body: "Take multiple-choice quizzes with per-question marks, submit, and see the result immediately.",
  },
  {
    icon: Target,
    label: "Topic accuracy",
    body: "See strong topics and weak topics side by side -- computed from every quiz taken so far.",
  },
  {
    icon: TrendingUp,
    label: "Performance trend",
    body: "A per-class trend of the last few assessments, with completion rate and time per question.",
  },
];

export default function ForStudentsSection() {
  return (
    <section className="border-t border-ink-200 bg-ink-100/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* LEFT -- composition */}
          <StudentComposition />

          {/* RIGHT -- copy */}
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
              <Compass size={12} />
              For students
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
              Learn, practice,
              <br />
              and know where you stand.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg">
              Everything a student needs for a class, in one place -- and a
              clear view of what to work on next.
            </p>

            <ul className="mt-8 flex flex-col gap-5">
              {STUDENT_FEATURES.map((f) => (
                <FeatureItem key={f.label} {...f} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function StudentComposition() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-6 rounded-[3rem] bg-brand-200/30 blur-3xl"
      />

      {/* Stack: performance card (top) */}
      <div className="relative z-20 mx-auto w-[88%] rounded-2xl border border-ink-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            Your performance
          </p>
          <span className="rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-700">
            Average
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Average" value="62%" />
          <StatTile label="Accuracy" value="71%" />
          <StatTile label="Completed" value="92%" />
        </div>
        <div className="mt-3 space-y-1.5">
          <SmallBar label="Kinematics" percent={82} tone="success" />
          <SmallBar label="Projectile Motion" percent={38} tone="danger" />
        </div>
      </div>

      {/* Stack: quiz card (middle, offset) */}
      <div className="relative z-10 -mt-3 ml-0 mr-6 rounded-2xl border border-ink-200 bg-white p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <PenLine size={14} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink-900">
              Newton&apos;s Laws -- Short Check
            </p>
            <p className="mt-0.5 text-[10px] text-ink-500">
              Grade 10 Physics -- 5 questions
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-md bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                Start quiz
              </span>
              <span className="text-[10px] text-ink-500">8 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stack: materials row (bottom) */}
      <div className="relative z-0 ml-6 mr-0 -mt-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-lg">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
          Materials
        </p>
        <div className="space-y-1.5">
          <MaterialRow title="Newton's Laws -- Notes" sub="PDF -- 240 KB" />
          <MaterialRow title="Motion Practice Problems" sub="PDF -- 500 KB" />
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-lg bg-ink-100/60 p-2">
      <p className="text-[9px] uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function SmallBar({ label, percent, tone }) {
  const BG = tone === "success" ? "bg-success-500" : tone === "danger" ? "bg-danger-500" : "bg-brand-500";
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 truncate text-[10px] text-ink-700">
        {label}
      </span>
      <span className="flex-1">
        <span className="block h-1 w-full overflow-hidden rounded-full bg-ink-100">
          <span className={"block h-full rounded-full " + BG} style={{ width: `${percent}%` }} />
        </span>
      </span>
      <span className="w-8 shrink-0 text-right text-[10px] font-semibold text-ink-500">
        {percent}%
      </span>
    </div>
  );
}

function MaterialRow({ title, sub }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
        <FolderOpen size={11} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-ink-900">{title}</p>
        <p className="text-[9px] text-ink-500">{sub}</p>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, label, body }) {
  return (
    <li className="flex items-start gap-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-ink-200">
        <Icon size={16} />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">{body}</p>
      </div>
    </li>
  );
}
