// frontend/src/features/student/pages/StudentPlaceholderPage.jsx
import { Construction } from "lucide-react";

export default function StudentPlaceholderPage({ title, description }) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </header>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
          <Construction size={24} />
        </span>
        <h2 className="font-display text-lg font-extrabold text-navy-950">
          Coming soon
        </h2>
        <p className="max-w-md text-sm text-slate-500">
          {description || "Your teacher or admin will fill this in soon."}
        </p>
      </div>
    </div>
  );
}