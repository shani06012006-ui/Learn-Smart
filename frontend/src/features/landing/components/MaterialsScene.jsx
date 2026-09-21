import { FileText, BookOpen, ClipboardList, Folder } from "lucide-react";

import LearningScene, { useSceneReveal } from "./LearningScene";
import { MiniPanel, MiniBadge } from "./previewParts";

const MATERIALS = [
  { icon: FileText, title: "Newton's Laws — Notes", sub: "PDF · 240 KB", tag: "Recent" },
  { icon: ClipboardList, title: "Motion Practice Problems", sub: "PDF · 500 KB", tag: "Practice" },
  { icon: BookOpen, title: "Chapter 4 Summary", sub: "Notes · 2 pages", tag: "Reading" },
  { icon: FileText, title: "Mid-term Syllabus", sub: "PDF · 180 KB", tag: "Exam" },
];

export default function MaterialsScene() {
  const { ref, revealed } = useSceneReveal();

  return (
    <LearningScene
      id="materials"
      tone="muted"
      eyebrow="Materials"
      title="A study desk that keeps itself tidy."
      subtitle="Everything your teacher shares — notes, PDFs, practice sets — collected in one place."
      full
    >
      <div ref={ref} className="mx-auto max-w-5xl">
        {/* Subject folder row */}
        <div className="mb-6 flex flex-wrap gap-3">
          <FolderChip name="Physics" count={8} active />
          <FolderChip name="Chemistry" count={5} />
          <FolderChip name="Mathematics" count={3} />
        </div>

        {/* Material cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MATERIALS.map((m, i) => {
            const Icon = m.icon;
            return (
              <MiniPanel
                key={m.title}
                className={
                  "group flex items-start gap-3 p-4 transition-all duration-500 " +
                  "hover:-translate-y-0.5 hover:shadow-xl " +
                  (revealed
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0")
                }
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:scale-110">
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {m.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-500">{m.sub}</p>
                </div>
                <MiniBadge tone="brand">{m.tag}</MiniBadge>
              </MiniPanel>
            );
          })}
        </div>
      </div>
    </LearningScene>
  );
}

function FolderChip({ name, count, active = false }) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs " +
        (active
          ? "border-brand-300 bg-brand-50 text-brand-700 ring-1 ring-brand-200"
          : "border-ink-200 bg-white text-ink-700")
      }
    >
      <Folder size={12} />
      <span className="font-medium">{name}</span>
      <span className="text-ink-400">{count}</span>
    </div>
  );
}
