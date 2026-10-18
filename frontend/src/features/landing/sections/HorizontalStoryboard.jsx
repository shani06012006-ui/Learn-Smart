// frontend/src/features/landing/sections/HorizontalStoryboard.jsx
// Page order: hero → subjects → feature band → teachers → experts → classes → FAQ
import Panel1Hero from "./Panel1Hero";
import Panel2Bento from "./Panel2Bento";
import TrustBand from "./TrustBand";
import TeacherSection from "./TeacherSection";
import Panel4Testimonials from "./Panel4Testimonials";
import CoursesSection from "./CoursesSection";
import Panel5FaqNewsletter from "./Panel5FaqNewsletter";

export default function HorizontalStoryboard() {
  return (
    <div className="relative w-full">
      <Panel1Hero />
      <Panel2Bento />
      <TrustBand />
      <TeacherSection />
      <Panel4Testimonials />
      <CoursesSection />
      <Panel5FaqNewsletter />
    </div>
  );
}