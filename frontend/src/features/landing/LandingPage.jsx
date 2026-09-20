import LandingNavbar from "./components/LandingNavbar";
import HeroSection from "./components/HeroSection";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <LandingNavbar />
      {/* Spacer for fixed navbar */}
      <div className="h-16" aria-hidden="true" />
      <HeroSection />
    </div>
  );
}
