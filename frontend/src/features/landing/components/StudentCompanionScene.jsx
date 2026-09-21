import { BookOpen, Sparkles, ClipboardList, Video } from "lucide-react";

import StudentCharacter from "./StudentCharacter";
import FloatingLearningObject from "./FloatingLearningObject";
import LearningScene, { useSceneReveal } from "./LearningScene";

export default function StudentCompanionScene() {
  const { ref, revealed } = useSceneReveal();

  return (
    <LearningScene
      id="companion"
      tone="muted"
      full
    >
      <div ref={ref} className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Character side */}
        <div
          className={
            "relative flex justify-center lg:justify-start " +
            (revealed ? "landing-reveal is-visible" : "landing-reveal")
          }
        >
          <div className="relative">
            <StudentCharacter
              pose="studying"
              reveal={revealed}
              size="lg"
              className="mx-auto lg:mx-0"
            />

            <FloatingLearningObject
              reveal={revealed}
              delay={300}
              shape="chip"
              className="-left-4 top-4 hidden sm:block"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-700">
                <BookOpen size={12} className="text-brand-500" />
                Your classes
              </span>
            </FloatingLearningObject>

            <FloatingLearningObject
              reveal={revealed}
              delay={600}
              shape="card"
              className="-right-6 top-16 hidden w-48 md:block"
            >
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-500" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-ink-500">
                    Today
                  </p>
                  <p className="truncate text-xs font-semibold text-ink-900">
                    Revise Motion · 15 min
                  </p>
                </div>
              </div>
            </FloatingLearningObject>

            <FloatingLearningObject
              reveal={revealed}
              delay={900}
              shape="card"
              className="-left-6 bottom-24 hidden w-44 md:block"
            >
              <div className="flex items-center gap-2">
                <ClipboardList size={14} className="text-brand-500" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-ink-500">
                    Quiz progress
                  </p>
                  <p className="truncate text-xs font-semibold text-ink-900">
                    3 of 5 done
                  </p>
                </div>
              </div>
            </FloatingLearningObject>

            <FloatingLearningObject
              reveal={revealed}
              delay={1200}
              shape="chip"
              className="right-2 bottom-8"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-700">
                <Video size={12} className="text-brand-500" />
                Live class in 2h
              </span>
            </FloatingLearningObject>
          </div>
        </div>

        {/* Copy side */}
        <div
          className={
            "landing-reveal landing-reveal-delay-1 " +
            (revealed ? "is-visible" : "")
          }
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Meet Learn-Smart
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
            A learning companion
            <br />
            that knows your path.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-500 md:text-lg">
            Your classes, materials, quizzes, and progress — in one place.
            Learn-Smart watches where you are, and quietly helps you take the
            next step.
          </p>
        </div>
      </div>
    </LearningScene>
  );
}
