// frontend/src/features/teacher/pages/TeacherLiveClassesPage.jsx
import { useMemo, useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Loader2,
  PlayCircle,
  Radio,
  Video,
  Users,
  Play,
} from "lucide-react";

import { useGetStudentLiveClassesQuery } from "../../../store/api/realApi";
import { getRoleConfig } from "../../../config/roleConfig";

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function canHost(session) {
  if (!session) return false;
  if (session.computed_status === "cancelled") return false;
  if (session.computed_status === "completed") return false;
  if (!session.meeting_url) return false;

  const now = new Date();
  const start = new Date(session.scheduled_start);
  const end = new Date(session.scheduled_end);
  const minBefore = 5 * 60 * 1000;
  return now >= new Date(start.getTime() - minBefore) && now <= end;
}

export default function TeacherLiveClassesPage() {
  const R = getRoleConfig("teacher");
  const { data, isLoading, isError, refetch } = useGetStudentLiveClassesQuery();

  const sessions = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  }, [data]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const { liveNow, upcoming, past } = useMemo(() => {
    const liveNow = [];
    const upcoming = [];
    const past = [];
    const now = new Date();

    for (const s of sessions) {
      const status =
        s.computed_status ||
        (s.stored_status === "cancelled" ? "cancelled" : "upcoming");

      if (status === "cancelled") continue;
      if (status === "live") liveNow.push(s);
      else if (status === "completed") past.push(s);
      else if (s.scheduled_start && new Date(s.scheduled_start) > now)
        upcoming.push(s);
      else past.push(s);
    }

    upcoming.sort(
      (a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start),
    );
    past.sort(
      (a, b) => new Date(b.scheduled_start) - new Date(a.scheduled_start),
    );
    return { liveNow, upcoming: upcoming.slice(0, 10), past: past.slice(0, 10) };
  }, [sessions]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
          Live Classes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Host your scheduled sessions and interact with your students.
        </p>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white/90 py-24 backdrop-blur-md">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 p-5 text-sm">
          <p className="font-semibold text-coral-700">
            Could not load live classes.
          </p>
          <button
            onClick={refetch}
            className="mt-2 rounded-lg bg-coral-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Live now */}
      {liveNow.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">
              Live now
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {liveNow.map((s) => (
              <SessionCard key={s.id} session={s} tone="live" />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/85 p-8 text-center backdrop-blur-md">
            <Video size={22} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-500">
              No upcoming sessions
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Your schedule will reflect here once generated.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {upcoming.map((s) => (
              <SessionCard key={s.id} session={s} tone="upcoming" />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Past sessions
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {past.map((s) => (
              <SessionCard key={s.id} session={s} tone="past" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SessionCard({ session, tone }) {
  const subject =
    session.class_course?.subject ||
    session.class_course?.name ||
    "Session";
  const className =
    session.class_course?.name || session.class_name || "Class";

  const hostable = canHost(session);

  const toneStyles = {
    live: "border-rose-200 bg-rose-50/40",
    upcoming: "border-gray-100 bg-white/95",
    past: "border-gray-100 bg-white/60 opacity-80",
  }[tone];

  return (
    <div
      className={
        "flex flex-col gap-3 rounded-2xl border p-5 shadow-sm backdrop-blur-md " +
        toneStyles
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-extrabold text-navy-950">
            {subject}
          </h3>
          <p className="truncate text-xs text-slate-500">{className}</p>
        </div>
        {tone === "live" && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <Radio size={11} />
            Live
          </span>
        )}
        {tone === "past" && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Ended
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={11} className="text-slate-400" />
          {formatDateTime(session.scheduled_start)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={11} className="text-slate-400" />
          {formatTime(session.scheduled_start)} –{" "}
          {formatTime(session.scheduled_end)}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-end">
        {tone === "past" ? (
          session.recording_url ? (
            <a
              href={session.recording_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <PlayCircle size={12} />
              View recording
            </a>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400 italic">
              No recording
            </span>
          )
        ) : hostable && session.meeting_url ? (
          <a
            href={session.meeting_url}
            target="_blank"
            rel="noreferrer"
            className={
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition " +
              (tone === "live"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-purple-600 hover:bg-purple-700")
            }
          >
            <Play size={12} />
            Start class
          </a>
        ) : (
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500">
            Start opens 5 min before
          </span>
        )}
      </div>
    </div>
  );
}