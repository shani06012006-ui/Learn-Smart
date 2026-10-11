import {
  GraduationCap,
  Plus,
  Upload,
  ClipboardList,
  Megaphone,
  BarChart3,
  Lightbulb,
} from "lucide-react";

// Mirrored layout (text left, visual right) to break the rhythm from the
// student section directly above. Visual is a two-panel composition: a
// class dashboard fragment and a "who needs attention" list.

const TEACHER_FEATURES = [
  {
    icon: Plus,
    label: "Create a class",
    body: "Set up a class and get a joining code students can redeem once to enroll.",
  },
  {
    icon: Upload,
    label: "Upload materials",
    body: "Share notes, PDFs, and practice sets with a class. Every enrolled student is notified.",
  },
  {
    icon: ClipboardList,
    label: "Build quizzes",
    body: "Add multiple-choice questions, set per-question marks and duration, and publish when ready.",
  },
  {
    icon: Megaphone,
    label: "Post announcements",
    body: "Reach every enrolled student with a class-wide message. Pinned items stay at the top.",
  },
  {
    icon: BarChart3,
    label: "See who needs attention",
    body: "A class-level view of students below target, students improving, and the weakest topic by error rate.",
  },
  {
    icon: Lightbulb,
    label: "Recommendations",
    body: "The dashboard surfaces next-step suggestions derived from the class data -- nothing invented.",
  },
];

export default function ForTeachersSection() {
  return (
    <section className="border-t border-ink-200 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* LEFT -- copy */}
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
              <GraduationCap size={12} />
              For teachers
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
              Run your classes
              <br />
              without the busywork.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg">
              Set up a class once. Materials, quizzes, announcements, and
              performance all flow through it -- so the admin disappears and
              teaching gets the time back.
            </p>

            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {TEACHER_FEATURES.map((f) => (
                <FeatureItem key={f.label} {...f} />
              ))}
            </ul>
          </div>

          {/* RIGHT -- composition */}
          <TeacherComposition />
        </div>
      </div>
    </section>
  );
}

function TeacherComposition() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        aria-hidden="true"
        className="absolute inset-6 rounded-[3rem] bg-brand-100/40 blur-3xl"
      />

      {/* Top card -- class roster + trend */}
      <div className="relative z-10 rounded-2xl border border-ink-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <GraduationCap size={14} />
            </span>
            <div>
              <p className="text-xs font-semibold text-ink-900">
                Grade 10 Physics
              </p>
              <p className="text-[10px] text-ink-500">Class overview</p>
            </div>
          </div>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
            12 students
          </span>
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
          Class average -- last 5 assessments
        </p>
        <div className="flex h-20 items-end gap-2">
          {[
            { label: "Q1", value: 68 },
            { label: "Q2", value: 64 },
            { label: "MT", value: 59 },
            { label: "Q3", value: 55 },
            { label: "Q4", value: 52 },
          ].map((bar) => (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-brand-500 to-brand-400"
                style={{ height: `${bar.value}%` }}
              />
              <span className="text-[9px] text-ink-500">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom card -- attention list */}
      <div className="relative z-20 -mt-3 ml-6 rounded-2xl border border-ink-200 bg-white p-4 shadow-lg">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            Needs attention
          </p>
          <span className="rounded-full bg-danger-50 px-2 py-0.5 text-[10px] font-semibold text-danger-700">
            1
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning-500 text-[9px] font-bold text-white">
            AM
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-ink-900">
              Arjun Mehta
            </p>
            <p className="text-[9px] text-ink-500">Chemistry -- 62%</p>
          </div>
        </div>
        <div className="mt-2.5 rounded-lg bg-brand-50/60 px-2.5 py-2">
          <div className="flex items-center gap-1.5">
            <Lightbulb size={10} className="text-brand-500" />
            <p className="text-[9px] font-semibold uppercase tracking-wider text-brand-700">
              Recommendation
            </p>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-ink-700">
            Consider scheduling a one-on-one review session.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, label, body }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon size={14} />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{body}</p>
      </div>
    </li>
  );
}
