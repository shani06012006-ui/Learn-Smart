// frontend/src/components/feedback/ErrorState.jsx
import { AlertTriangle } from "lucide-react";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-coral-200 bg-coral-50/50 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-100 text-coral-600">
        <AlertTriangle size={22} />
      </span>
      <p className="max-w-md text-sm font-semibold text-navy-950">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-full bg-purple-500 px-5 py-2 text-xs font-bold text-white shadow-purple-glow transition-all hover:bg-purple-600"
        >
          Try again
        </button>
      )}
    </div>
  );
}