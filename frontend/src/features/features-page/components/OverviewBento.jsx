import {
  Users,
  BookOpen,
  ClipboardList,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";

// Bento grid: one large "Classes" tile plus three supporting tiles.
// Deliberately different from the landing page's uniform card grids -- the
// mixed sizes create a rhythm that reads as a designed composition rather
// than a layout template.

export default function OverviewBento() {
  return (
    <section className="border-t border-ink-200 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            The connected classroom
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
            Everything a class needs,
            <br />
            wired together.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-500 md:text-lg">
            Classes anchor everything else. Materials, quizzes, conversations,
            and performance flow through them -- so nothing lives in a
            separate tool, and nothing gets lost between them.
          </p>
        </header>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          {/* Classes -- large tile, spans two rows on desktop */}
          <BentoCard
            className="md:col-span-1 md:row-span-2"
            icon={Users}
            eyebrow="Foundation"
            title="Classes"
            body="Teachers create a class and share a joining code. Students redeem the code once and are enrolled. Rosters, materials, quizzes, announcements, and a class chat all attach to the class."
          >
            <div className="mt-6 space-y-2">
              <RosterChip initials="RS" name="Rahul Sharma" tone="brand" />
              <RosterChip initials="MN" name="Meera Nair" tone="brand" />
              <RosterChip initials="AM" name="Arjun Mehta" tone="warning" />
              <div className="pt-1 text-center text-[11px] text-ink-500">
                + 9 more enrolled
              </div>
            </div>
          </BentoCard>

          <BentoCard
            icon={BookOpen}
            eyebrow="Resources"
            title="Materials"
            body="Upload notes, PDFs, and practice sets. Students see them per class and open a detail view with the uploader, size, and type."
          />

          <BentoCard
            icon={ClipboardList}
            eyebrow="Assessment"
            title="Quizzes"
            body="Build multiple-choice quizzes, set per-question marks, publish to a class, and review every submission with per-question accuracy."
          />

          <BentoCard
            className="md:col-span-2"
            icon={MessageSquare}
            eyebrow="Communication"
            title="Messages & Notifications"
            body="Direct and class-wide threads keep teachers and students talking in context. Real events -- a new message, material, announcement, or quiz -- surface as notifications without leaving the app."
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  className = "",
  icon: Icon,
  eyebrow,
  title,
  body,
  children,
}) {
  return (
    <article
      className={
        "group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-xl " +
        className
      }
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-100">
          <Icon size={18} />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
          {eyebrow}
        </p>
      </div>

      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">{body}</p>

      {children}

      <ArrowUpRight
        size={16}
        className="pointer-events-none absolute right-5 top-5 text-ink-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-500"
        aria-hidden="true"
      />
    </article>
  );
}

function RosterChip({ initials, name, tone = "brand" }) {
  const BG = tone === "warning" ? "bg-warning-500" : "bg-brand-500";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2">
      <span
        className={
          "flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white " +
          BG
        }
      >
        {initials}
      </span>
      <span className="truncate text-xs text-ink-700">{name}</span>
    </div>
  );
}
