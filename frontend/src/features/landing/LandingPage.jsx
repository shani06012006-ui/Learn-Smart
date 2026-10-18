// frontend/src/features/landing/LandingPage.jsx
import EduviNavbar from "./components/EduviNavbar";
import EduviFooter from "./components/EduviFooter";
import HorizontalStoryboard from "./sections/HorizontalStoryboard";

export default function LandingPage() {
  return (
    <div className="landing min-h-screen bg-white font-sans text-ink-900">
      <EduviNavbar />
      <main>
        <HorizontalStoryboard />
      </main>
      <EduviFooter />
    </div>
  );
}