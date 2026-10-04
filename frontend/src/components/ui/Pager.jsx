// frontend/src/components/ui/Pager.jsx
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pager({ page = 1, count = 0, pageSize = 20, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (count === 0) return null;

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <p className="text-xs text-slate-500">
        Page <span className="font-bold text-navy-950">{page}</span> of{" "}
        <span className="font-bold text-navy-950">{totalPages}</span>
        <span className="ml-2 text-slate-400">· {count} total</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:text-navy-950 disabled:opacity-40"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500 text-white shadow-purple-glow transition-all hover:bg-purple-600 disabled:opacity-40"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}