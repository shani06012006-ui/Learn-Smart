import LandingNavbar from "./components/LandingNavbar";
import HeroSection from "./components/HeroSection";

// Public landing page. For L1 this renders the navbar and hero only;
// L2/L3 will append the middle and bottom sections.
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
