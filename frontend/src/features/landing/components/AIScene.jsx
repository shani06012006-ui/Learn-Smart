import { Sparkles, Target, BookOpen, ClipboardList, ArrowDown } from "lucide-react";

import LearningScene, { useSceneReveal } from "./LearningScene";
import StudentCharacter from "./StudentCharacter";
import {
  MiniPanel,
  MiniProgress,
  MiniBadge,
} from "./previewParts";

export default function AIScene() {
  const { ref, revealed } = useSceneReveal();

  return (
    <LearningScene
      id="ai"
      eyebrow="AI-assistance"
      title="Not sure what to study next?"
      subtitle="Every quiz result feeds a clear next step — no guessing, no waiting."
      full
    >
      <div
        ref={ref}
        className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16"
      >
        {/* Character side — smaller, positioned as if looking at the flow */}
        <div
          className={
            "flex justify-center lg:justify-start " +
            (revealed ? "landing-reveal is-visible" : "landing-reveal")
          }
        >
          <StudentCharacter
            pose="pointing"
            reveal={revealed}
            size="md"
            className="mx-auto lg:mx-0"
          />
        </div>

        {/* Flow side */}
        <div className="flex flex-col items-stretch gap-3">
          <FlowStep
            reveal={revealed}
            delay={0}
            icon={ClipboardList}
            label="Step 1 · Quiz result"
            tone="danger"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-500">Physics · Quiz 4</span>
              <span className="text-lg font-semibold text-danger-700">48%</span>
            </div>
            <div className="mt-2">
              <MiniProgress value={48} variant="danger" />
            </div>
          </FlowStep>

          <Connector reveal={revealed} delay={200} />

          <FlowStep
            reveal={revealed}
            delay={400}
            icon={Target}
            label="Step 2 · Weak topic detected"
            tone="warning"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-900">
                Projectile Motion
              </span>
              <MiniBadge tone="warning">38% accuracy</MiniBadge>
            </div>
          </FlowStep>

          <Connector reveal={revealed} delay={600} />

          <FlowStep
            reveal={revealed}
            delay={800}
            icon={BookOpen}
            label="Step 3 · Recommended material"
            tone="brand"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  Motion Practice Problems
                </p>
                <p className="text-[11px] text-ink-500">PDF · 10 min</p>
              </div>
              <MiniBadge tone="brand">Suggested</MiniBadge>
            </div>
          </FlowStep>

          <Connector reveal={revealed} delay={1000} />

          <FlowStep
            reveal={revealed}
            delay={1200}
            icon={Sparkles}
            label="Step 4 · Follow-up quiz"
            tone="success"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  Motion — Short Check
                </p>
                <p className="text-[11px] text-ink-500">5 questions · 8 min</p>
              </div>
              <MiniBadge tone="success">Ready</MiniBadge>
            </div>
          </FlowStep>
        </div>
      </div>
    </LearningScene>
  );
}

function FlowStep({ reveal, delay, icon: Icon, label, tone = "brand", children }) {
  const BORDER = {
    danger: "border-l-danger-500",
    warning: "border-l-warning-500",
    brand: "border-l-brand-500",
    success: "border-l-success-500",
  };

  return (
    <MiniPanel
      className={
        "border-l-4 p-4 transition-all duration-700 " +
        BORDER[tone] +
        " " +
        (reveal
          ? "translate-x-0 opacity-100 is-visible"
          : "translate-x-6 opacity-0")
      }
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} className="text-brand-500" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
          {label}
        </p>
      </div>
      {children}
    </MiniPanel>
  );
}

function Connector({ reveal, delay }) {
  return (
    <div
      className={
        "flex justify-center transition-opacity duration-500 " +
        (reveal ? "opacity-100" : "opacity-0")
      }
      style={{ transitionDelay: `${delay}ms` }}
      aria-hidden="true"
    >
      <div className="flex h-6 items-center">
        <ArrowDown size={14} className="text-ink-300" />
      </div>
    </div>
  );
}
