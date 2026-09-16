import { AlertTriangle } from "lucide-react";
import Button from "../ui/Button";

// message can come straight from an RTK Query error object's `data.detail`,
// `data.error.detail`, or a plain string — callers just pass whatever they have.
export default function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-danger-50 bg-danger-50/40 py-16 text-center">
      <AlertTriangle className="mb-1 h-10 w-10 text-danger-500" strokeWidth={1.5} />
      <p className="font-medium text-ink-900">{title}</p>
      {message && <p className="max-w-sm text-sm text-ink-500">{String(message)}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
