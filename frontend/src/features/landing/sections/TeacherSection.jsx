// frontend/src/features/landing/sections/TeacherSection.jsx
import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2, FileText, ScanText, Sparkles, Video } from "lucide-react";
import SafeImage from "../components/SafeImage";
import { AVATARS, IMAGES } from "../landingAssets";

const POINTS = [
  { icon: Sparkles, title: "Quiz from any PDF", text: "Upload notes, get 10 questions." },
  { icon: ScanText, title: "Auto grading", text: "Scores and feedback in seconds." },
  { icon: CalendarCheck, title: "Attendance & timetable", text: "One view for every section." },
  { icon: Video, title: "Live classes", text: "Schedule and join in one tap." },
];

export default function TeacherSection() {
  return (
    <section id="teachers" className="scroll-mt-4 bg-white pb-20 lg:pb-28">
      <div className="container-wide grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* ── Copy ───────────────────────────────────────────── */}
        <div>
          <h2 className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink-900 sm:text-4xl">
            Reach Every Student, Save Hours Every Week
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-500">
            Learn Smart handles the repetitive work — quizzes, grading,
            registers, timetables — so you can spend your time teaching.
          </p>

          <ul className="mt-9 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-sage-300">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-900">{title}</p>
                  <p className="mt-0.5 text-sm text-ink-500">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            to="/register"
            className="mt-10 inline-flex items-center rounded-full bg-ink-800 px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-700"
          >
            Start teaching free
          </Link>
        </div>

        {/* ── Visual ─────────────────────────────────────────── */}
        <div className="relative mx-auto aspect-square w-full max-w-md">
          {/* dotted field */}
          <div
            aria-hidden
            className="dot-field absolute inset-0 rounded-full [mask-image:radial-gradient(circle,black_40%,transparent_72%)]"
          />
          {/* photo */}
          <div className="absolute inset-[16%] overflow-hidden rounded-full bg-ink-700 shadow-2xl ring-8 ring-white">
            <SafeImage
              src={IMAGES.teacher}
              alt="Teacher smiling at her laptop"
              className="h-full w-full object-cover"
            />
          </div>

          {/* little avatar bubbles */}
          {[
            { src: AVATARS[0], pos: "left-[6%] top-[34%]" },
            { src: AVATARS[2], pos: "right-[4%] top-[14%]" },
            { src: AVATARS[1], pos: "right-[12%] bottom-[30%]" },
          ].map((b) => (
            <SafeImage
              key={b.pos}
              src={b.src}
              alt=""
              className={`absolute h-11 w-11 rounded-full border-[3px] border-white object-cover shadow-md ${b.pos}`}
            />
          ))}

          {/* floating cards */}
          <div className="absolute left-0 top-[8%] flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl ring-1 ring-ink-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-ink-700">
              <FileText size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-ink-900">Fractions-ch4.pdf</p>
              <p className="flex items-center gap-1 text-[11px] text-ink-500">
                <CheckCircle2 size={11} className="text-sage-600" />
                Quiz generated
              </p>
            </div>
          </div>

          <div className="absolute bottom-[6%] right-0 w-44 rounded-2xl bg-ink-800 p-4 text-white shadow-xl">
            <p className="text-[11px] text-white/60">Class 5B attendance</p>
            <p className="mt-1 font-display text-2xl font-semibold">94%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-[94%] rounded-full bg-sage-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}