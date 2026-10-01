// frontend/src/features/programs/ProgramsPage.jsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, X, Clock, Users, MapPin, ArrowRight, Cpu, Briefcase,
  FlaskConical, Palette, HeartPulse, CheckCircle2, Sparkles, Layers,
} from "lucide-react";
import LandingNavbar from "../landing/components/LandingNavbar";

/* ---------------- Data ---------------- */
const CATS = ["All", "Technology", "Business", "Science", "Arts", "Health"];

const PROGRAMS = [
  { id: "cs", cat: "Technology", icon: Cpu, grad: "from-blue-600 to-[#0b1f4d]", title: "B.Sc. Computer Science", level: "Undergraduate", years: "4 years", mode: "On campus", seats: 120, intake: "Fall 2026",
    summary: "Algorithms, systems and AI with a live-project studio every semester.",
    modules: ["Programming & Data Structures", "Operating Systems", "Machine Learning", "Capstone Studio"] },
  { id: "ds", cat: "Technology", icon: Cpu, grad: "from-violet-600 to-indigo-900", title: "M.Sc. Data Science", level: "Postgraduate", years: "2 years", mode: "Hybrid", seats: 60, intake: "Fall 2026",
    summary: "Statistics, big-data engineering and applied ML with industry datasets.",
    modules: ["Statistical Modelling", "Data Engineering", "Deep Learning", "Thesis Project"] },
  { id: "mba", cat: "Business", icon: Briefcase, grad: "from-amber-500 to-orange-700", title: "MBA in Global Management", level: "Postgraduate", years: "2 years", mode: "Hybrid", seats: 90, intake: "Spring 2027",
    summary: "Leadership, finance and strategy with a term abroad at a partner campus.",
    modules: ["Strategy & Leadership", "Corporate Finance", "Global Markets", "Consulting Residency"] },
  { id: "fin", cat: "Business", icon: Briefcase, grad: "from-emerald-500 to-teal-800", title: "B.Com. Finance & Analytics", level: "Undergraduate", years: "3 years", mode: "On campus", seats: 150, intake: "Fall 2026",
    summary: "Accounting foundations plus data tools for modern finance careers.",
    modules: ["Financial Accounting", "Business Statistics", "Risk & Markets", "Analytics Lab"] },
  { id: "bio", cat: "Science", icon: FlaskConical, grad: "from-teal-500 to-cyan-800", title: "B.Sc. Biotechnology", level: "Undergraduate", years: "4 years", mode: "On campus", seats: 80, intake: "Fall 2026",
    summary: "Lab-first training in genetics, bioprocessing and research methods.",
    modules: ["Cell Biology", "Genetics Lab", "Bioprocess Engineering", "Research Thesis"] },
  { id: "env", cat: "Science", icon: FlaskConical, grad: "from-lime-500 to-green-800", title: "Certificate in Climate Science", level: "Certificate", years: "6 months", mode: "Online", seats: 200, intake: "Rolling",
    summary: "A focused, flexible primer on climate data, policy and mitigation.",
    modules: ["Climate Systems", "Data & Modelling", "Policy & Economics"] },
  { id: "design", cat: "Arts", icon: Palette, grad: "from-rose-500 to-fuchsia-800", title: "B.Des. Interaction Design", level: "Undergraduate", years: "4 years", mode: "On campus", seats: 70, intake: "Fall 2026",
    summary: "Research-led product, motion and service design with real clients.",
    modules: ["Design Foundations", "UX Research", "Prototyping Studio", "Client Capstone"] },
  { id: "nurse", cat: "Health", icon: HeartPulse, grad: "from-sky-500 to-blue-800", title: "B.Sc. Nursing Practice", level: "Undergraduate", years: "4 years", mode: "On campus", seats: 100, intake: "Fall 2026",
    summary: "Clinical rotations from year one, backed by simulation labs.",
    modules: ["Anatomy & Physiology", "Clinical Practice", "Community Health", "Internship"] },
];

const PATH = [
  { t: "Discover", d: "Explore programs, talk to advisors and attend a virtual open day.", chips: ["Program finder", "Advisor chat", "Open days"] },
  { t: "Apply", d: "One application, one dashboard. Upload documents and track your status live.", chips: ["Online form", "Document upload", "Live status"] },
  { t: "Learn", d: "Classes, materials, quizzes and live sessions in a single workspace.", chips: ["Live classes", "AI study help", "Progress tracking"] },
  { t: "Graduate", d: "Capstone, career support and an alumni network that stays with you.", chips: ["Capstone", "Career services", "Alumni hub"] },
];

/* ---------------- Helpers ---------------- */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.add("is-in");
        io.disconnect();
      }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = "" }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

/* ---------------- Sections ---------------- */
function Hero({ query, setQuery }) {
  return (
    <section className="relative overflow-hidden pb-14 pt-16 md:pt-24">
      <div aria-hidden className="prog-blob absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl" />
      <div aria-hidden className="prog-blob absolute -right-20 top-24 h-72 w-72 rounded-full bg-violet-200/50 blur-3xl [animation-delay:-4s]" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
          <Sparkles size={13} className="text-blue-600" /> {PROGRAMS.length} programs · 5 faculties · Fall 2026 intake open
        </span>
        <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Find the program that fits{" "}
          <span className="bg-gradient-to-r from-[#0b1f4d] to-blue-500 bg-clip-text text-transparent">where you're going.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Browse degrees and certificates, peek inside the curriculum, and apply in minutes.
        </p>
        <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-xl transition-shadow focus-within:shadow-2xl focus-within:ring-2 focus-within:ring-blue-300">
          <Search size={18} className="shrink-0 text-blue-600" />
          <label htmlFor="prog-search" className="sr-only">Search programs</label>
          <input
            id="prog-search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 'data', 'design', 'nursing'…"
            className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryTabs({ cat, setCat, counts }) {
  const refs = useRef({});
  const [ind, setInd] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const place = () => {
      const el = refs.current[cat];
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [cat]);

  return (
    <div className="relative inline-flex max-w-full overflow-x-auto rounded-full border border-slate-200 bg-white p-1.5 shadow-sm [scrollbar-width:none]" role="tablist" aria-label="Program categories">
      <span aria-hidden className="absolute bottom-1.5 top-1.5 rounded-full bg-[#0b1f4d] shadow-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ left: ind.left, width: ind.width }} />
      {CATS.map((c) => (
        <button
          key={c} ref={(el) => (refs.current[c] = el)} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
          className={`relative z-10 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${cat === c ? "text-white" : "text-slate-600 hover:text-slate-900"}`}
        >
          {c} <span className={`ml-1 text-xs ${cat === c ? "text-blue-200" : "text-slate-400"}`}>{counts[c]}</span>
        </button>
      ))}
    </div>
  );
}

function ProgramCard({ p, i, onOpen }) {
  const Icon = p.icon;
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <button
      type="button" onClick={() => onOpen(p)} onMouseMove={move}
      style={{ animationDelay: `${i * 60}ms` }}
      className="prog-in group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(260px circle at var(--mx) var(--my), rgba(37,99,235,0.10), transparent 70%)" }} />
      <div className={`relative flex h-32 items-end justify-between bg-gradient-to-br p-5 ${p.grad}`}>
        <Icon size={64} className="absolute -right-2 -top-2 text-white/15 transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6" />
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{p.level}</span>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-lg"><Icon size={20} /></span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-slate-900">{p.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{p.summary}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Clock size={13} />{p.years}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{p.mode}</span>
          <span className="inline-flex items-center gap-1.5"><Users size={13} />{p.seats} seats</span>
        </div>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
          View curriculum <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1.5" />
        </span>
      </div>
    </button>
  );
}

function Drawer({ p, open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside
        role="dialog" aria-modal="true" aria-label={p?.title}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {p && (
          <>
            <div className={`relative bg-gradient-to-br p-6 pb-8 text-white ${p.grad}`}>
              <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/20 p-2 hover:bg-white/30"><X size={18} /></button>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{p.level} · {p.cat}</span>
              <h2 className="mt-4 pr-10 text-2xl font-bold leading-tight">{p.title}</h2>
              <p className="mt-2 text-sm text-white/80">{p.summary}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3">
                {[["Duration", p.years], ["Mode", p.mode], ["Seats", p.seats], ["Next intake", p.intake]].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{v}</p>
                  </div>
                ))}
              </div>
              <h3 className="mt-7 flex items-center gap-2 text-sm font-semibold text-slate-900"><Layers size={16} className="text-blue-600" />Curriculum</h3>
              <ol className="mt-4 space-y-0">
                {p.modules.map((m, i) => (
                  <li key={m} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < p.modules.length - 1 && <span aria-hidden className="absolute left-[13px] top-7 h-full w-px bg-slate-200" />}
                    <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{i + 1}</span>
                    <span className="pt-0.5 text-sm font-medium text-slate-800">{m}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex gap-3 border-t border-slate-200 p-5">
              <Link to="/register" className="flex-1 rounded-full bg-[#0b1f4d] py-3 text-center text-sm font-semibold text-white shadow-md hover:bg-blue-900">Apply now</Link>
              <Link to="/login" className="flex-1 rounded-full border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Student login</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function LearningPath() {
  const [step, setStep] = useState(0);
  const cur = PATH[step];
  return (
    <section className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">From first click to graduation</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-600">Tap a stage to see how EduCore supports you at each step.</p>
        </Reveal>

        <Reveal className="mt-12">
          <div className="relative">
            <div aria-hidden className="absolute left-0 right-0 top-5 h-1 rounded-full bg-slate-200" />
            <div aria-hidden className="absolute left-0 top-5 h-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${(step / (PATH.length - 1)) * 100}%` }} />
            <div className="relative grid grid-cols-4">
              {PATH.map((s, i) => (
                <button key={s.t} type="button" onClick={() => setStep(i)} aria-current={step === i} className="group flex flex-col items-center gap-3 focus:outline-none">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full border-4 border-slate-50 text-sm font-bold transition-all duration-500 group-focus-visible:ring-2 group-focus-visible:ring-blue-500 ${i <= step ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-500 shadow"} ${i === step ? "scale-125" : ""}`}>
                    {i < step ? <CheckCircle2 size={18} /> : i + 1}
                  </span>
                  <span className={`text-sm font-semibold transition-colors ${i === step ? "text-slate-900" : "text-slate-500"}`}>{s.t}</span>
                </button>
              ))}
            </div>
          </div>

          <div key={step} className="prog-in mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
            <h3 className="text-xl font-semibold text-slate-900">{cur.t}</h3>
            <p className="mt-2 max-w-2xl text-slate-600">{cur.d}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {cur.chips.map((c) => <span key={c} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{c}</span>)}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */
export default function ProgramsPage() {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const counts = useMemo(() => {
    const c = { All: PROGRAMS.length };
    CATS.slice(1).forEach((k) => { c[k] = PROGRAMS.filter((p) => p.cat === k).length; });
    return c;
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROGRAMS.filter((p) =>
      (cat === "All" || p.cat === cat) &&
      (!q || `${p.title} ${p.summary} ${p.cat}`.toLowerCase().includes(q))
    );
  }, [cat, query]);

  const openDrawer = (p) => { setSelected(p); setOpen(true); };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <style>{`
        @keyframes progIn { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes progBlob { 0%,100% { translate: 0 0; } 50% { translate: 24px -18px; } }
        .prog-in { animation: progIn .6s cubic-bezier(.22,1,.36,1) both; }
        .prog-blob { animation: progBlob 12s ease-in-out infinite; }
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity .8s ease, transform .8s cubic-bezier(.22,1,.36,1); }
        .reveal.is-in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { .prog-in, .prog-blob { animation: none; } .reveal { opacity: 1; transform: none; transition: none; } }
      `}</style>

      <LandingNavbar />
      <div className="h-20" aria-hidden="true" />

      <Hero query={query} setQuery={setQuery} />

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CategoryTabs cat={cat} setCat={setCat} counts={counts} />
            <p role="status" aria-live="polite" className="text-sm font-medium text-slate-500">
              {list.length} program{list.length === 1 ? "" : "s"}
            </p>
          </div>

          {list.length ? (
            <div key={`${cat}-${query}`} className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((p, i) => <ProgramCard key={p.id} p={p} i={i} onOpen={openDrawer} />)}
            </div>
          ) : (
            <div className="prog-in mt-16 rounded-3xl border border-dashed border-slate-300 py-16 text-center">
              <p className="text-lg font-semibold text-slate-900">No programs match "{query}".</p>
              <button type="button" onClick={() => { setQuery(""); setCat("All"); }} className="mt-4 rounded-full bg-[#0b1f4d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900">Clear filters</button>
            </div>
          )}
        </div>
      </section>

      <LearningPath />

      <section className="px-6 py-20 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-blue-600 to-[#0b1f4d] px-8 py-14 text-center text-white sm:px-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Not sure which program is right?</h2>
            <p className="mx-auto mt-4 max-w-xl text-blue-100">Talk to an admissions advisor. We reply within 24 hours.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0b1f4d] hover:bg-blue-50">Request a demo</Link>
              <Link to="/" className="rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold hover:bg-white/10">Back to home</Link>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} EduCore. All rights reserved.
      </footer>

      <Drawer p={selected} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}