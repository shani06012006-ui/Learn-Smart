export default function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base dark */}
      <div className="absolute inset-0 bg-night-900" />

      {/* animated grid */}
      <div
        className="absolute inset-0 animate-grid-flow opacity-[0.6]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(46,230,200,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(46,230,200,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at 50% 40%, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 20%, transparent 70%)",
        }}
      />

      {/* drifting neon blobs */}
      <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] animate-blob rounded-full bg-brand-500/12 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 h-[36rem] w-[36rem] animate-blob rounded-full bg-accent-500/10 blur-[120px] [animation-delay:6s]" />
      <div className="absolute bottom-0 left-1/4 h-[28rem] w-[28rem] animate-blob rounded-full bg-gold-400/6 blur-[120px] [animation-delay:12s]" />
    </div>
  );
}