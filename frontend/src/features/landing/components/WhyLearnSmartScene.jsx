import {
  Sparkles,
  Target,
  Video,
  Users,
  BarChart3,
  Shield,
} from "lucide-react";

import LearningScene, { useSceneReveal } from "./LearningScene";
import { MiniPanel } from "./previewParts";

const CAPABILITIES = [
  { icon: Sparkles, title: "Personalized learning", body: "Weak-topic detection and recommended next steps." },
  { icon: BarChart3, title: "AI-assisted analysis", body: "Performance insights computed from real quiz data." },
  { icon: Video, title: "Live learning workflow", body: "Scheduled sessions with instant student notifications." },
  { icon: Users, title: "Teacher-student collaboration", body: "Chat, doubts, and feedback in one place." },
  { icon: Target, title: "Performance-driven insights", body: "Strengths, gaps, and trends visible at a glance." },
  { icon: Shield, title: "Role-based dashboards", body: "Separate views for students and teachers, one login." },
];

export default function WhyLearnSmartScene() {
  const { ref, revealed } = useSceneReveal();

  return (
    <LearningScene
      id="why"
      eyebrow="Why Learn-Smart"
      title="Everything you need for a connected learning environment."
      subtitle="No scattered tools. No lost context. One platform that sees the whole picture."
      full
    >
      <div ref={ref} className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => {
            const Icon = c.icon;
            return (
              <MiniPanel
                key={c.title}
                className={
                  "flex flex-col gap-3 p-5 transition-all duration-500 " +
                  (revealed
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0")
                }
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{c.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    {c.body}
                  </p>
                </div>
              </MiniPanel>
            );
          })}
        </div>
      </div>
    </LearningScene>
  );
}
