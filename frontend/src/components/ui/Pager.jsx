import { ChevronLeft, ChevronRight } from "lucide-react";

import Button from "./Button";

// Pagination control. Presentational only — the parent owns the page
// state and passes `page`, `count`, `pageSize`, and an `onPageChange`
// callback. Matches the DRF PageNumberPagination contract:
//   { count, next, previous, results }
//
// The parent derives totalPages from count/pageSize; this component
// just renders Prev / "Page X of Y" / Next.
export default function Pager({
  page = 1,
  count = 0,
  pageSize = 20,
  onPageChange,
  disabled = false,
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const canPrev = page > 1 && !disabled;
  const canNext = page < totalPages && !disabled;

  // Hide the whole control when there's only one page — avoids visual
  // noise on small lists.
  if (count === 0 || totalPages <= 1) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-ink-500">
        Showing <span className="font-medium text-ink-700">{start}</span>
        {"–"}
        <span className="font-medium text-ink-700">{end}</span> of{" "}
        <span className="font-medium text-ink-700">{count}</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(page - 1)}
        >
          <ChevronLeft size={14} />
          Previous
        </Button>

        <span className="px-2 text-xs text-ink-600">
          Page <span className="font-medium text-ink-900">{page}</span> of{" "}
          <span className="font-medium text-ink-900">{totalPages}</span>
        </span>

        <Button
          size="sm"
          variant="secondary"
          disabled={!canNext}
          onClick={() => canNext && onPageChange(page + 1)}
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}