import LandingNavbar from "./components/LandingNavbar";
import HeroSection from "./components/HeroSection";
import LandingFooter from "./components/LandingFooter";
import TrustBar from "./sections/TrustBar";
import FeaturesSection from "./sections/FeaturesSection";
import CategorySection from "./sections/CategorySection";
import ProfileCtaSection from "./sections/ProfileCtaSection";
import TestimonialsSection from "./sections/TestimonialsSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <LandingNavbar />
      {/* Spacer for fixed navbar */}
      <div className="h-16" aria-hidden="true" />
      <main>
        <HeroSection />
        <TrustBar />
        <FeaturesSection />
        <CategorySection />
        <ProfileCtaSection />
        <TestimonialsSection />
      </main>
      <LandingFooter />
    </div>
  );
}