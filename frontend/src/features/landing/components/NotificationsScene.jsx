import { Bell, BookOpen, Video, ClipboardList, Megaphone } from "lucide-react";

import LearningScene, { useSceneReveal } from "./LearningScene";
import { MiniPanel } from "./previewParts";

const NOTIFICATIONS = [
  { icon: Megaphone, tone: "brand", title: "New announcement", body: "Quiz on Newton's Laws — Friday." },
  { icon: BookOpen, tone: "brand", title: "New study material", body: "Motion Practice Problems uploaded." },
  { icon: Video, tone: "success", title: "Live class starts soon", body: "Mid-term Revision at 18:00." },
  { icon: ClipboardList, tone: "warning", title: "Quiz assigned", body: "Physics · Motion — 5 questions." },
];

const TONE_ICON = {
  brand: "bg-brand-50 text-brand-600",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
};

export default function NotificationsScene() {
  const { ref, revealed } = useSceneReveal();

  return (
    <LearningScene
      id="notifications"
      eyebrow="Notifications"
      title="The right updates, at the right time."
      subtitle="Important notices appear as they happen — never buried in a feed."
      full
    >
      <div ref={ref} className="mx-auto max-w-2xl">
        <div className="flex flex-col gap-3">
          {NOTIFICATIONS.map((n, i) => {
            const Icon = n.icon;
            return (
              <MiniPanel
                key={n.title}
                className={
                  "flex items-start gap-3 p-4 transition-all duration-700 " +
                  (revealed
                    ? "translate-x-0 opacity-100"
                    : "translate-x-6 opacity-0")
                }
                style={{ transitionDelay: `${i * 250}ms` }}
              >
                <span
                  className={
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
                    TONE_ICON[n.tone]
                  }
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {n.title}
                    </p>
                    <Bell size={12} className="mt-1 shrink-0 text-ink-400" />
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-500">
                    {n.body}
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
