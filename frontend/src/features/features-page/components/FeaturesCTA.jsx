import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap } from "lucide-react";

import Button from "../../../components/ui/Button";

// Single CTA band. Deliberately a shorter, tighter composition than the
// landing page's FinalCTAScene so it doesn't read as a duplicate.

export default function FeaturesCTA() {
  return (
    <section className="border-t border-ink-200 bg-brand-50/40 py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-lg">
          <GraduationCap size={26} />
        </div>

        <h2 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
          Try it with your class.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg">
          Create an account to set up a class, upload materials, and build a
          first quiz -- or sign in to an existing one.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register">
            <Button size="lg">
              Create an account
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
