import { Link } from "react-router-dom";
import { Construction, ArrowRight } from "lucide-react";

export default function TeacherPlaceholder({ title }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
        <Construction size={26} strokeWidth={2} />
      </span>
      <h1 className="font-display text-2xl font-extrabold text-navy-950">
        {title}
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        This module is coming soon.
      </p>
      <Link
        to="/teacher"
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-purple-500 transition-transform hover:translate-x-0.5"
      >
        Back to Dashboard
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}