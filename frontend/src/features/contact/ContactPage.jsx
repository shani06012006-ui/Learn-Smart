// frontend/src/features/contact/ContactPage.jsx
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageCircle, Clock } from "lucide-react";

import EduviNavbar from "../landing/components/EduviNavbar";
import EduviFooter from "../landing/components/EduviFooter";
import SubscribeSection from "../landing/sections/SubscribeSection";

const EASE = [0.22, 1, 0.36, 1];

const CONTACT_INFO = [
  { icon: Mail,   label: "Email",  value: "hello@eduvi.co",             href: "mailto:hello@eduvi.co" },
  { icon: Phone,  label: "Phone",  value: "+1 (555) 010-2030",          href: "tel:+15550102030" },
  { icon: MapPin, label: "Office", value: "Boston · London · Singapore", href: null },
  { icon: Clock,  label: "Hours",  value: "Mon–Fri, 9am–6pm local",      href: null },
];

const TOPICS = ["General enquiry", "Institution demo", "Partnership", "Support", "Press"];

function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-paper-50">
      <div className="container-wide flex h-12 items-center gap-2 text-xs">
        <Link to="/" className="font-semibold text-slate-400 transition-colors hover:text-navy-950">
          Home
        </Link>
        <span className="text-slate-300">|</span>
        <span className="font-bold text-purple-500">Contact</span>
      </div>
    </nav>
  );
}

function ContactForm() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: TOPICS[0],
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: "", email: "", topic: TOPICS[0], message: "" });
    }, 4000);
  };

  return (
    <motion.form
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE }}
      onSubmit={onSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-elevated sm:p-8"
    >
      <h2 className="font-display text-xl font-extrabold text-navy-950 sm:text-2xl">
        Send us a message
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        We reply within one business day.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-bold text-navy-950">
            Full name
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onChange}
            required
            placeholder="Esther Howard"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-bold text-navy-950">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            placeholder="you@example.com"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div>
          <label htmlFor="topic" className="block text-xs font-bold text-navy-950">
            Topic
          </label>
          <select
            id="topic"
            name="topic"
            value={form.topic}
            onChange={onChange}
            className="mt-2 h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-bold text-navy-950">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={onChange}
            required
            rows={5}
            placeholder="Tell us what's on your mind…"
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-500 text-sm font-bold text-white shadow-purple-glow transition-all hover:bg-purple-600 hover:-translate-y-0.5"
        >
          {submitted ? (
            <>
              <CheckCircle2 size={16} /> Message sent
            </>
          ) : (
            <>
              <Send size={15} />
              Send message
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}

function ContactInfo() {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
      className="space-y-4"
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
            <MessageCircle size={18} />
          </span>
          <h3 className="font-display text-lg font-extrabold text-navy-950">
            Talk to us directly
          </h3>
        </div>

        <ul className="mt-5 space-y-4">
          {CONTACT_INFO.map((info) => {
            const Icon = info.icon;
            return (
              <li key={info.label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-navy-950">
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {info.label}
                  </p>
                  {info.href ? (
                    <a
                      href={info.href}
                      className="mt-0.5 block truncate text-sm font-semibold text-navy-950 hover:text-purple-500"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="mt-0.5 text-sm font-semibold text-navy-950">{info.value}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-purple-50 to-paper-100 shadow-card">
        <div className="relative aspect-[4/3] w-full">
          {/* HERE IS YOUR IMAGE — map screenshot — paste a URL over the src */}
          <img
            src=""
            alt="Office location"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div aria-hidden className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-purple-400">
              <MapPin size={32} />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Boston HQ
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function PageHero() {
  return (
    <section className="bg-paper-100 pb-8 pt-6">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-paper-100 to-purple-100/40 px-6 py-10 sm:px-10 sm:py-14"
        >
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-coral-100 bg-coral-50/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-coral-500">
              <MessageCircle size={12} />
              Get in touch
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-navy-950 sm:text-4xl md:text-5xl">
              We'd love to hear from you
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-500 sm:text-base">
              Questions about the platform, partnerships, or a demo? Send us
              a message and our team will get back to you within 24 hours.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-paper-50 font-sans text-navy-950">
      <EduviNavbar />
      <div className="h-20" aria-hidden="true" />

      <main>
        <Breadcrumb />
        <PageHero />
        <section className="py-14">
          <div className="container-wide grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            <ContactForm />
            <ContactInfo />
          </div>
        </section>
        <SubscribeSection />
      </main>

      <EduviFooter />
    </div>
  );
}