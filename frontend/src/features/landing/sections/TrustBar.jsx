import Reveal from "../components/Reveal";

const INSTITUTIONS = [
  "Greenwood High",
  "Northwood Academy",
  "Riverdale Institute",
  "Zaitoon International",
  "St. Xavier College",
  "Sunrise Public School",
];

export default function TrustBar() {
  return (
    <section
      id="trust"
      aria-label="Trusted by institutions"
      className="relative border-y border-white/[0.06] bg-night-800/40 py-14 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-400">
            Trusted by <span className="text-brand-300">200+</span> institutions worldwide
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {INSTITUTIONS.map((name) => (
              <span
                key={name}
                className="select-none text-base font-semibold tracking-tight text-muted-400 opacity-60 transition-all hover:text-brand-300 hover:opacity-100 sm:text-lg"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}