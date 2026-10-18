// frontend/src/features/landing/LandingPage.jsx
import EduviNavbar from "./components/EduviNavbar";
import EduviFooter from "./components/EduviFooter";
import HorizontalStoryboard from "./sections/HorizontalStoryboard";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper-50 font-sans text-navy-950">
      <EduviNavbar />
      <div className="h-20" aria-hidden="true" />
      <main>
        <HorizontalStoryboard />
      </main>
      <EduviFooter />
    </div>
  );
}