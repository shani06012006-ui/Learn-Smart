export default function GradientHero() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
      <div
        className="absolute inset-0 animate-gradient-x bg-[linear-gradient(120deg,#fff5ed_0%,#ffe8d5_25%,#fff_50%,#ffe8d5_75%,#fff5ed_100%)] bg-[length:200%_200%]"
      />
      {/* soft floating orbs */}
      <div className="absolute left-1/4 top-1/4 h-40 w-40 rounded-full bg-accent-300/40 blur-2xl animate-float" />
      <div className="absolute right-1/4 bottom-1/4 h-56 w-56 rounded-full bg-accent-200/50 blur-3xl animate-float [animation-delay:2s]" />
    </div>
  );
}