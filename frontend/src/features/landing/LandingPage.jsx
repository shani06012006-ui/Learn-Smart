import LandingNavbar from "./components/LandingNavbar";
import HeroSection from "./components/HeroSection";
import LandingFooter from "./components/LandingFooter";
import ScrollProgress from "./components/ScrollProgress";
import MetricsBand from "./sections/MetricsBand";
import FeaturesSection from "./sections/FeaturesSection";
import ReachSection from "./sections/ReachSection";
import CommunitySection from "./sections/CommunitySection";
import TestimonialsSection from "./sections/TestimonialsSection";
import FaqSection from "./sections/FaqSection";

export default function LandingPage() {
  return (
    <>
      <ScrollProgress />

      <div className="relative">
        <LandingNavbar />
        <div className="h-20" aria-hidden="true" />
        <main>
          {/* 1 */}  <HeroSection />
          {/* 2 */}  <MetricsBand />
          {/* 3 */}  <FeaturesSection />
          {/* 4 */}  <ReachSection />
          {/* 5 */}  <CommunitySection />
          {/* 6 */}  <TestimonialsSection />
          {/* 7 */}  <FaqSection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}