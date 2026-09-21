import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap } from "lucide-react";

import Button from "../../../components/ui/Button";
import LearningScene from "./LearningScene";

export default function FinalCTAScene() {
  return (
    <LearningScene
      id="start"
      tone="brand"
      full
      className="!border-t-0"
    >
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-lg">
          <GraduationCap size={26} />
        </div>

        <h2 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
          Ready to make learning smarter?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg">
          Bring classes, materials, assessments, live learning, communication,
          and progress tracking into one connected platform.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/login">
            <Button size="lg">
              Start Learning
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/register">
            <Button size="lg" variant="secondary">
              Teach with Learn-Smart
            </Button>
          </Link>
        </div>
      </div>
    </LearningScene>
  );
}
