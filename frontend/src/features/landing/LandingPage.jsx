// frontend/src/features/landing/LandingPage.jsx
import EduviNavbar from "./components/EduviNavbar";
import EduviFooter from "./components/EduviFooter";
import HeroSection from "./sections/HeroSection";
import VideoSection from "./sections/VideoSection";
import StandardsSection from "./sections/StandardsSection";
import DarkCtaSection from "./sections/DarkCtaSection";
import MentorSection from "./sections/MentorSection";
import SubscribeSection from "./sections/SubscribeSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper-100 font-sans text-navy-950">
      <EduviNavbar />
      <div className="h-20" aria-hidden="true" />
      <main>
        <HeroSection />
        <VideoSection />
        <StandardsSection />
        <DarkCtaSection />
        <MentorSection />
        <SubscribeSection />
      </main>
      <EduviFooter />
    </div>
  );
}