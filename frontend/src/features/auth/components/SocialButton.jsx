// frontend/src/features/auth/components/SocialButton.jsx
export default function SocialButton({ label = "Continue with google", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-navy-950 transition-all hover:border-slate-300 hover:bg-slate-50"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.55c2.08-1.92 3.28-4.74 3.28-8.33Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.77c-.98.66-2.23 1.06-3.73 1.06-2.87 0-5.3-1.94-6.17-4.55H2.18v2.85A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.83 14.08A6.6 6.6 0 0 1 5.48 12c0-.72.13-1.42.35-2.08V7.07H2.18a11 11 0 0 0 0 9.86l3.65-2.85Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.65 2.85C6.7 7.32 9.13 5.38 12 5.38Z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}