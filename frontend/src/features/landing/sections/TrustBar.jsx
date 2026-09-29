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
      className="border-y border-ink-200 bg-accent-50/40 py-12"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-ink-500">
          Trusted by 200+ institutions worldwide
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {INSTITUTIONS.map((name) => (
            <span
              key={name}
              className="select-none text-base font-semibold tracking-tight text-ink-500 opacity-60 transition-opacity hover:opacity-100 sm:text-lg"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}