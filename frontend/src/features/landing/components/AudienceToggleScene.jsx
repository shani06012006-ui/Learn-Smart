import { useState } from "react";
import {
  BookOpen,
  ClipboardList,
  Trophy,
  Video,
  Bell,
  Users,
  Megaphone,
  BarChart3,
  FileText,
} from "lucide-react";

import LearningScene, { useSceneReveal } from "./LearningScene";
import StudentCharacter from "./StudentCharacter";
import { MiniPanel, MiniAvatar, MiniBadge } from "./previewParts";

const STUDENT_ITEMS = [
  { icon: BookOpen, label: "My Classes", tone: "brand" },
  { icon: FileText, label: "Materials", tone: "brand" },
  { icon: ClipboardList, label: "Quizzes", tone: "brand" },
  { icon: Trophy, label: "Performance", tone: "brand" },
  { icon: Video, label: "Live Classes", tone: "success" },
  { icon: Bell, label: "Notifications", tone: "warning" },
];

const TEACHER_ITEMS = [
  { icon: BookOpen, label: "Classes", tone: "brand" },
  { icon: Users, label: "Student Roster", tone: "brand" },
  { icon: FileText, label: "Materials", tone: "brand" },
  { icon: ClipboardList, label: "Quizzes", tone: "brand" },
  { icon: Megaphone, label: "Announcements", tone: "warning" },
  { icon: BarChart3, label: "Performance Insights", tone: "success" },
  { icon: Video, label: "Live Classes", tone: "success" },
];

const TONE_ICON = {
  brand: "bg-brand-50 text-brand-600",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
};

export default function AudienceToggleScene() {
  const { ref, revealed } = useSceneReveal();
  const [mode, setMode] = useState("student");
  const items = mode === "student" ? STUDENT_ITEMS : TEACHER_ITEMS;

  return (
    <LearningScene
      id="audience"
      tone="muted"
      eyebrow="One platform"
      title="Two experiences, one login."
      subtitle="Students learn. Teachers orchestrate. Both live on the same data."
      full
    >
      <div ref={ref} className="mx-auto max-w-5xl">
        {/* Toggle */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white p-1 shadow-sm">
            <ToggleButton
              active={mode === "student"}
              onClick={() => setMode("student")}
            >
              Student
            </ToggleButton>
            <ToggleButton
              active={mode === "teacher"}
              onClick={() => setMode("teacher")}
            >
              Teacher
            </ToggleButton>
          </div>
        </div>

        <div
          className={
            "grid grid-cols-1 items-center gap-8 transition-all duration-500 lg:grid-cols-2 lg:gap-12 " +
            (revealed ? "opacity-100" : "opacity-0")
          }
        >
          {/* Character / avatar */}
          <div className="flex justify-center lg:justify-start">
            {mode === "student" ? (
              <StudentCharacter
                pose="studying"
                reveal={revealed}
                size="md"
                className="mx-auto lg:mx-0"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <MiniAvatar initials="AI" color="bg-success-500" />
                <p className="text-sm font-semibold text-ink-900">Anita Iyer</p>
                <MiniBadge tone="brand">Teacher</MiniBadge>
              </div>
            )}
          </div>

          {/* Feature list — key changes force remount, which re-triggers
              the fade/slide animation on every toggle */}
          <ul key={mode} className="flex flex-col gap-2">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className="landing-toggle-item"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <MiniPanel className="flex items-center gap-3 p-3">
                    <span
                      className={
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " +
                        TONE_ICON[item.tone]
                      }
                    >
                      <Icon size={15} />
                    </span>
                    <span className="text-sm font-medium text-ink-900">
                      {item.label}
                    </span>
                  </MiniPanel>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </LearningScene>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "bg-brand-600 text-white shadow-sm"
          : "text-ink-700 hover:bg-ink-100")
      }
    >
      {children}
    </button>
  );
}
