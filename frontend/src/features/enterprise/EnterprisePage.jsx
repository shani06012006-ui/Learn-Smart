// frontend/src/features/enterprise/EnterprisePage.jsx
// Standard Tailwind classes only (no custom tokens), no framer-motion.
// Smooth effects: scroll-reveal, count-up stats, tweened ROI numbers, hover lifts, smooth anchor scroll.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Shield, Server, Lock, Building2, BarChart3, Globe2, CheckCircle2,
  Sparkles, TrendingUp, Zap, FileCheck, Headphones, BookOpen, Database,
} from "lucide-react";
import LandingNavbar from "../landing/components/LandingNavbar";
import LandingFooter from "../landing/components/LandingFooter";

/* ---------------- Motion helpers ---------------- */
function useInViewOnce(threshold = 0.15) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (!("IntersectionObserver" in window)) return setSeen(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, seen] = useInViewOnce(0.1);
  return (
    <div ref={ref} className={`ent-rv ${seen ? "ent-in" : ""} ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function CountUp({ to, dec = 0, suffix = "" }) {
  const [ref, seen] = useInViewOnce(0.4);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (reduced()) return setV(to);
    let raf, t0;
    const tick = (t) => {
      t0 ??= t;
      const p = Math.min(1, (t - t0) / 1400);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);
  return <span ref={ref}>{v.toFixed(dec)}{suffix}</span>;
}

// Smoothly tweens toward `target` whenever it changes
function useTween(target, ms = 600) {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduced()) return setVal(target);
    const start = from.current, t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      const next = start + (target - start) * (1 - Math.pow(1 - p, 3));
      from.current = next;
      setVal(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

const money = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const BTN = "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2";

/* ---------------- Hero ---------------- */
const DEPLOY = [
  ["Avg. rollout", "6 wks", "bg-blue-50 text-blue-700"],
  ["Systems", "42+", "bg-slate-100 text-slate-700"],
  ["Data migrated", "18 TB", "bg-emerald-50 text-emerald-700"],
  ["Downtime", "0 hrs", "bg-violet-50 text-violet-700"],
];

function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-10 md:pb-28 md:pt-16">
      {/* diagonal navy panel: desktop only, so text never sits on it */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[46%] lg:block">
        <div className="h-full w-full bg-gradient-to-br from-[#0b1f4d] via-[#12307a] to-blue-600" style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }} />
        <div className="absolute inset-0 opacity-15" style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)", backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      </div>
      <div aria-hidden className="ent-blob absolute -left-24 top-20 -z-10 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <div className="min-w-0">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <Building2 size={13} className="text-blue-600" /> For universities &amp; multi-campus networks
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Institutional LMS,{" "}
              <span className="bg-gradient-to-r from-[#0b1f4d] to-blue-500 bg-clip-text text-transparent">built for scale.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Deploy EduCore across departments, campuses, and hybrid programs. Enterprise-grade security, native SIS/ERP integration, and a dedicated onboarding team.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/register" className={`${BTN} group bg-[#0b1f4d] text-white shadow-lg hover:-translate-y-0.5 hover:bg-blue-900`}>
                Book a demo <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#roi" className={`${BTN} border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50`}>
                <TrendingUp size={16} /> Estimate savings
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              {["Dedicated onboarding lead", "Custom SLA terms", "24/7 priority support"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" />{t}</li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="min-w-0">
          <div className="ent-float mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:ml-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-[#0b1f4d] text-[10px] font-bold text-white">EC</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Deployment snapshot</p>
                  <p className="text-[11px] text-slate-500">Last 90 days · All customers</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {DEPLOY.map(([l, v, chip]) => (
                <div key={l} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-transform duration-300 hover:-translate-y-0.5">
                  <p className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${chip}`}>{l}</p>
                  <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-900">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#0b1f4d] px-3 py-2.5 text-white">
              <FileCheck size={14} className="text-blue-300" />
              <p className="text-xs font-medium"><span className="font-bold">18 universities</span> deployed this year</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Stats ---------------- */
const STATS = [
  { to: 150, suffix: "+", label: "Partner universities", bar: "bg-[#0b1f4d]" },
  { to: 1.5, dec: 1, suffix: "M", label: "Students on platform", bar: "bg-blue-500" },
  { to: 99.9, dec: 1, suffix: "%", label: "Uptime SLA", bar: "bg-emerald-500" },
  { to: 4.9, dec: 1, label: "Institutional rating", bar: "bg-violet-500" },
];

function Stats() {
  return (
    <section className="border-y border-slate-200 bg-white py-14">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 sm:grid-cols-4 lg:px-8">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <div className="text-center sm:text-left">
              <p className="text-4xl font-bold tracking-tight tabular-nums text-slate-900 sm:text-5xl"><CountUp to={s.to} dec={s.dec} suffix={s.suffix} /></p>
              <span className={`mx-auto mt-3 block h-1 w-12 rounded-full sm:mx-0 ${s.bar}`} />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Capabilities ---------------- */
const CAPS = [
  { icon: Server, title: "Flexible deployment", desc: "SaaS, private cloud, or fully on-premise.", grad: "from-violet-500 to-indigo-600" },
  { icon: Shield, title: "Enterprise security", desc: "SSO, MFA, RBAC, audit logs, full encryption.", grad: "from-blue-500 to-cyan-600" },
  { icon: Globe2, title: "Multi-campus ready", desc: "Central policies, per-campus branding.", grad: "from-emerald-500 to-teal-600" },
  { icon: BarChart3, title: "Institutional analytics", desc: "Real-time KPIs across departments and years.", grad: "from-amber-500 to-orange-600" },
  { icon: Zap, title: "Native integrations", desc: "Banner, Colleague, PowerSchool, Canvas, D2L.", grad: "from-fuchsia-500 to-pink-600" },
  { icon: Headphones, title: "White-glove support", desc: "Dedicated CSM and a 24/7 priority queue.", grad: "from-sky-500 to-blue-600" },
  { icon: BookOpen, title: "Curriculum tools", desc: "Author, version, and approve courses easily.", grad: "from-rose-500 to-red-600" },
  { icon: Database, title: "Data ownership", desc: "Export everything. No lock-in. Ever.", grad: "from-slate-500 to-slate-700" },
];

const HEX = "polygon(50% 3%, 93% 26%, 93% 74%, 50% 97%, 7% 74%, 7% 26%)";

function DarkBand({ children, id }) {
  return (
    <section id={id} className="relative overflow-hidden bg-gradient-to-br from-[#1a1a4a] via-[#2d1b69] to-[#4c1d95] py-20 text-white md:py-28">
      <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
      <div aria-hidden className="ent-blob absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div aria-hidden className="ent-blob absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl [animation-delay:-5s]" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">{children}</div>
    </section>
  );
}

function Pill({ icon: Icon, children, tone = "text-fuchsia-300" }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
      <Icon size={12} className={tone} /> {children}
    </span>
  );
}

function Capabilities() {
  return (
    <DarkBand>
      <Reveal className="mx-auto max-w-3xl text-center">
        <Pill icon={Sparkles}>Enterprise capabilities</Pill>
        <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Everything a university needs.{" "}
          <span className="bg-gradient-to-r from-fuchsia-300 via-blue-300 to-emerald-300 bg-clip-text text-transparent">In one system.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          Purpose-built for running a modern institution, from procurement and compliance to daily operations.
        </p>
      </Reveal>
      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CAPS.map(({ icon: Icon, title, desc, grad }, i) => (
          <Reveal key={title} delay={(i % 4) * 0.07} className="h-full">
            <div className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:bg-white/[0.12]">
              <div className="h-14 w-14 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" style={{ clipPath: HEX }}>
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-white ${grad}`}><Icon size={22} /></div>
              </div>
              <h3 className="mt-5 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </DarkBand>
  );
}

/* ---------------- Compliance ---------------- */
const COMPLIANCE = [
  ["FERPA", "US student privacy", "from-[#0b1f4d] to-blue-800"],
  ["GDPR", "EU data protection", "from-blue-500 to-blue-700"],
  ["SOC 2", "Independently audited", "from-emerald-500 to-teal-700"],
  ["ISO 27001", "Info security", "from-amber-500 to-orange-700"],
  ["WCAG 2.1", "Accessible to all", "from-violet-500 to-indigo-700"],
  ["PCI DSS", "Payment security", "from-rose-500 to-pink-700"],
];
const HEX_OUT = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";
const HEX_IN = "polygon(50% 2%, 98% 26%, 98% 74%, 50% 98%, 2% 74%, 2% 26%)";

function Compliance() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="min-w-0 lg:col-span-5">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"><Lock size={13} className="text-blue-600" />Security &amp; compliance</span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Certified, audited, and{" "}
              <span className="bg-gradient-to-r from-[#0b1f4d] to-blue-500 bg-clip-text text-transparent">trusted by regulators.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">EduCore undergoes annual third-party audits and provides full compliance reports to every enterprise customer.</p>
          </Reveal>
          <Reveal delay={0.15} className="mt-10">
            <ol className="space-y-5 border-l-2 border-slate-100 pl-7">
              {["Independently audited annually", "Region-specific data residency", "Full report available on request", "Penetration-tested quarterly"].map((t, i) => (
                <li key={t} className="relative">
                  <span className="absolute -left-[39px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#0b1f4d] text-[10px] font-bold text-white">{i + 1}</span>
                  <p className="text-sm font-medium text-slate-700">{t}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
        <div className="min-w-0 lg:col-span-7">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:gap-8">
            {COMPLIANCE.map(([name, desc, grad], i) => (
              <Reveal key={name} delay={(i % 3) * 0.08}>
                <div className="group relative aspect-square -rotate-3 cursor-default transition-transform duration-500 ease-out hover:rotate-0 hover:scale-105">
                  <div className={`absolute inset-0 bg-gradient-to-br shadow-xl ${grad}`} style={{ clipPath: HEX_OUT }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-3 text-center" style={{ clipPath: HEX_IN }}>
                    <Shield size={20} className="text-[#0b1f4d] transition-transform duration-500 group-hover:scale-125" />
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-900">{name}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Deployments ---------------- */
const PLANS = [
  { name: "SaaS", tag: "Fastest to deploy", price: "Per active user", feat: false, items: ["Shared cloud infrastructure", "Automatic updates", "SOC 2 hosted on AWS", "99.9% uptime SLA", "Standard support"] },
  { name: "Private Cloud", tag: "Most popular", price: "Custom annual", feat: true, items: ["Dedicated VPC", "Region-specific residency", "Custom SLA (99.95%+)", "SAML/SSO + MFA", "Dedicated CSM + 24/7", "Custom integrations"] },
  { name: "On-Premise", tag: "Full sovereignty", price: "Annual license", feat: false, items: ["Runs in your data centre", "Air-gapped option", "Your maintenance windows", "Unlimited user seats", "On-site implementation", "Source escrow"] },
];

function Deployments() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 py-20 md:py-28">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">Deployment options</span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Run EduCore <span className="bg-gradient-to-r from-[#0b1f4d] to-blue-500 bg-clip-text text-transparent">your way.</span>
          </h2>
          <p className="mt-5 text-lg text-slate-600">Whether you need speed, control, or complete data sovereignty, there's a model for your institution.</p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3 lg:gap-0">
          {PLANS.map((d, i) => (
            <Reveal key={d.name} delay={i * 0.1} className={`h-full ${d.feat ? "relative z-20 lg:-mx-4" : "relative z-10"}`}>
              <div className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-7 transition-all duration-500 ease-out ${d.feat ? "border-[#0b1f4d] bg-gradient-to-br from-[#0b1f4d] to-[#060d24] text-white shadow-2xl lg:scale-105 lg:hover:scale-[1.07]" : `border-slate-200 bg-white shadow-lg hover:-translate-y-1.5 hover:shadow-2xl ${i === 0 ? "lg:-rotate-1 lg:hover:rotate-0" : "lg:rotate-1 lg:hover:rotate-0"}`}`}>
                {d.feat && <span className="absolute right-5 top-5 rounded-full bg-blue-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Popular</span>}
                <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${d.feat ? "text-blue-300" : "text-blue-700"}`}>{d.name}</p>
                <h3 className="mt-2 text-2xl font-bold">{d.tag}</h3>
                <p className={`mt-1 text-sm ${d.feat ? "text-white/70" : "text-slate-500"}`}>{d.price}</p>
                <ul className={`mt-7 flex-1 space-y-3 ${d.feat ? "text-white/85" : "text-slate-700"}`}>
                  {d.items.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm"><CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${d.feat ? "text-blue-300" : "text-emerald-500"}`} />{f}</li>
                  ))}
                </ul>
                <Link to="/register" className={`${BTN} group mt-8 ${d.feat ? "bg-white text-[#0b1f4d] hover:bg-blue-50" : "bg-[#0b1f4d] text-white hover:bg-blue-900"}`}>
                  Talk to sales <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Case study ---------------- */
function CaseStudy() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1f4d] via-[#12307a] to-blue-600 shadow-2xl">
            <div aria-hidden className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
            <div aria-hidden className="ent-blob absolute -right-32 -top-32 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="relative p-8 sm:p-12 md:p-16">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">Case study · Northwood University · 12,400 students</span>
              <h3 className="mt-4 max-w-3xl text-2xl font-bold leading-snug text-white sm:text-3xl md:text-4xl">
                &ldquo;We replaced four legacy tools in one semester. Faculty adoption jumped from 42% to 91% in the first term.&rdquo;
              </h3>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white ring-2 ring-white/20">ER</span>
                  <div><p className="text-sm font-semibold text-white">Dr. Elena Rostova</p><p className="text-xs text-white/60">Dean of Academics</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-6 sm:border-l sm:border-white/15 sm:pl-6">
                  {[["Faculty adoption", "91%"], ["Support tickets", "-52%"], ["Time to grade", "-68%"]].map(([k, v]) => (
                    <div key={k}><p className="text-2xl font-bold tabular-nums text-white">{v}</p><p className="text-[10px] uppercase tracking-wider text-white/60">{k}</p></div>
                  ))}
                </div>
              </div>
              <Link to="/register" className={`${BTN} group mt-8 bg-white text-[#0b1f4d] hover:bg-blue-50`}>
                Read the full case study <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- ROI ---------------- */
function Slider({ id, label, value, min, max, step, onChange, shown, ends }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-white/90">{label}</label>
        <span className="text-2xl font-bold tabular-nums text-blue-300">{shown}</span>
      </div>
      <input
        id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full"
        style={{ accentColor: "#60a5fa", background: `linear-gradient(to right,#60a5fa ${pct}%,rgba(255,255,255,.2) ${pct}%)` }}
      />
      <div className="mt-1.5 flex justify-between text-[10px] text-white/40"><span>{ends[0]}</span><span>{ends[1]}</span></div>
    </div>
  );
}

function Roi() {
  const [students, setStudents] = useState(8000);
  const [systems, setSystems] = useState(3);
  const legacy = students * 42 + systems * 18000;
  const educore = students * 18 + 12000;
  const yearly = Math.max(0, legacy - educore);
  const yShown = useTween(yearly);
  const fShown = useTween(yearly * 5);

  return (
    <DarkBand id="roi">
      <Reveal className="mx-auto max-w-3xl text-center">
        <Pill icon={TrendingUp} tone="text-emerald-300">ROI calculator</Pill>
        <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          See your estimated{" "}
          <span className="bg-gradient-to-r from-fuchsia-300 via-blue-300 to-emerald-300 bg-clip-text text-transparent">institutional savings.</span>
        </h2>
        <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">Adjust your numbers. Indicative figures only; every institution gets a tailored quote.</p>
      </Reveal>

      <Reveal delay={0.15} className="mt-14">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 rounded-3xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-xl sm:p-10 lg:grid-cols-5">
          <div className="space-y-8 lg:col-span-3">
            <Slider id="students" label="Total students" value={students} min={500} max={50000} step={500} onChange={setStudents} shown={students.toLocaleString("en-US")} ends={["500", "50,000"]} />
            <Slider id="systems" label="Legacy systems replaced" value={systems} min={1} max={8} step={1} onChange={setSystems} shown={systems} ends={["1", "8"]} />
            <p className="text-xs text-white/50">Assumes typical per-student licensing, one-time migration, and ongoing maintenance costs.</p>
          </div>
          <div className="flex flex-col justify-center gap-5 rounded-2xl bg-white/[0.08] p-6 ring-1 ring-white/10 lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">Estimated savings</p>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50">Per year</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{money(yShown)}</p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-[11px] uppercase tracking-wider text-white/50">Over 5 years</p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-emerald-300">{money(fShown)}</p>
            </div>
            <p className="text-[11px] leading-relaxed text-white/60">Includes consolidating {systems} system{systems === 1 ? "" : "s"} into a single EduCore license.</p>
          </div>
        </div>
      </Reveal>
    </DarkBand>
  );
}

/* ---------------- Talk to sales ---------------- */
const FIELD = "mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40";

function TalkToSales() {
  const [form, setForm] = useState({ institution: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    // TODO: POST `form` to your backend endpoint here
    setSent(true);
    setTimeout(() => { setSent(false); setForm({ institution: "", email: "", message: "" }); }, 3500);
  };

  return (
    <section className="relative overflow-hidden bg-[#060d24] text-white">
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[42%] lg:block">
        <div className="h-full w-full bg-gradient-to-br from-blue-700 via-[#12307a] to-[#060d24]" style={{ clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0 100%)" }} />
      </div>
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 py-20 md:py-28 lg:grid-cols-12 lg:gap-20 lg:px-8">
        <Reveal className="min-w-0 lg:col-span-6">
          <Pill icon={Sparkles} tone="text-blue-300">Talk to sales</Pill>
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Request a tailored{" "}
            <span className="bg-gradient-to-r from-blue-300 to-emerald-300 bg-clip-text text-transparent">institutional quote.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Share a few details and our institutional team will reply within one business day with a scoped proposal.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {["30-min discovery call with a solution architect", "Custom migration plan and timeline estimate", "Transparent per-student pricing", "References from institutions similar to yours"].map((t) => (
              <li key={t} className="flex items-start gap-2.5"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-300" />{t}</li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.12} className="min-w-0 lg:col-span-6">
          <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl sm:p-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="inst" className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Institution name</label>
                <input id="inst" required value={form.institution} onChange={set("institution")} placeholder="e.g. Northwood University" className={`${FIELD} h-12`} />
              </div>
              <div>
                <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Work email</label>
                <input id="email" type="email" required value={form.email} onChange={set("email")} placeholder="you@university.edu" className={`${FIELD} h-12`} />
              </div>
              <div>
                <label htmlFor="msg" className="text-[11px] font-semibold uppercase tracking-wider text-white/60">What are you trying to solve?</label>
                <textarea id="msg" rows={4} value={form.message} onChange={set("message")} placeholder="Consolidating tools, migrating off Canvas, hybrid programs…" className={`${FIELD} resize-none py-3`} />
              </div>
              <button type="submit" className={`${BTN} h-12 w-full rounded-xl bg-white text-[#0b1f4d] hover:bg-blue-50`}>
                {sent ? <><CheckCircle2 size={16} /> Thanks, we'll be in touch</> : <>Request tailored quote <ArrowRight size={15} /></>}
              </button>
              <p className="text-center text-[11px] text-white/50">No spam. Your details are never shared.</p>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */
export default function EnterprisePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    return () => { root.style.scrollBehavior = prev; };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900">
      <style>{`
        .ent-rv { opacity: 0; transform: translateY(28px); transition: opacity .8s ease, transform .8s cubic-bezier(.22,1,.36,1); }
        .ent-in { opacity: 1; transform: none; }
        @keyframes entFloat { 0%,100% { translate: 0 0; } 50% { translate: 0 -10px; } }
        @keyframes entBlob { 0%,100% { translate: 0 0; } 50% { translate: 26px -20px; } }
        .ent-float { animation: entFloat 7s ease-in-out infinite; }
        .ent-blob { animation: entBlob 14s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ent-rv { opacity: 1; transform: none; transition: none; } .ent-float, .ent-blob { animation: none; } }
      `}</style>

      <LandingNavbar />
      <div className="h-20" aria-hidden="true" />

      <main>
        <Hero />
        <Stats />
        <Capabilities />
        <Compliance />
        <Deployments />
        <CaseStudy />
        <Roi />
        <TalkToSales />
      </main>

      <LandingFooter />
    </div>
  );
}