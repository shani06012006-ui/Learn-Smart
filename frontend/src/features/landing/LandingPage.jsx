import { useState } from "react";
import LandingNavbar from "./components/LandingNavbar";
import HeroSection from "./components/HeroSection";
import LandingFooter from "./components/LandingFooter";
import IntroOverlay from "./components/IntroOverlay";
import AnimatedBackground from "./components/AnimatedBackground";
import CustomCursor from "./components/CustomCursor";
import ScrollProgress from "./components/ScrollProgress";
import LiveTicker from "./components/LiveTicker";
import TrustBar from "./sections/TrustBar";
import FeaturesSection from "./sections/FeaturesSection";
import CategorySection from "./sections/CategorySection";
import ProfileCtaSection from "./sections/ProfileCtaSection";
import TestimonialsSection from "./sections/TestimonialsSection";

export default function LandingPage() {
  const [ready, setReady] = useState(false);

  return (
    <>
      <IntroOverlay onDone={() => setReady(true)} />
      <AnimatedBackground />
      <CustomCursor />
      <ScrollProgress />

      <div
        className={`relative transition-opacity duration-700 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        <LandingNavbar />
        <div className="h-20" aria-hidden="true" />
        <main>
          <HeroSection />
          <LiveTicker />
          <TrustBar />
          <FeaturesSection />
          <CategorySection />
          <ProfileCtaSection />
          <TestimonialsSection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}