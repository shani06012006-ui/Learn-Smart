import FeaturesHero from "./components/FeaturesHero";
import OverviewBento from "./components/OverviewBento";
import ForStudentsSection from "./components/ForStudentsSection";
import ForTeachersSection from "./components/ForTeachersSection";
import WorkflowSection from "./components/WorkflowSection";
import RecommendationSection from "./components/RecommendationSection";
import FeaturesCTA from "./components/FeaturesCTA";
import LandingNavbar from "../landing/components/LandingNavbar";
import LandingFooter from "../landing/components/LandingFooter";

// Public marketing page. Reuses the landing navbar and footer so navigation
// stays consistent across the two public surfaces. Everything between them
// is composed specifically for this page -- no wrappers or scene templates
// borrowed from the landing page, so the two never read as siblings.
export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <LandingNavbar />
      <div className="h-16" aria-hidden="true" />
      <main>
        <FeaturesHero />
        <OverviewBento />
        <ForStudentsSection />
        <ForTeachersSection />
        <WorkflowSection />
        <RecommendationSection />
        <FeaturesCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
