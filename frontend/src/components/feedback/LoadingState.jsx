// frontend/src/components/feedback/LoadingState.jsx
export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <svg className="h-6 w-6 animate-spin text-purple-500" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
        <path d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" fill="currentColor" />
      </svg>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}