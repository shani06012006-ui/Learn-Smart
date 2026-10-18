// frontend/src/features/landing/sections/HorizontalStoryboard.jsx
import Panel1Hero from "./Panel1Hero";
import Panel2Bento from "./Panel2Bento";
import Panel4Testimonials from "./Panel4Testimonials";
import Panel5FaqNewsletter from "./Panel5FaqNewsletter";

export default function HorizontalStoryboard() {
  return (
    <div className="relative w-full">
      <Panel1Hero layout="vertical" />
      <Panel2Bento layout="vertical" />
      <Panel4Testimonials layout="vertical" />
      <Panel5FaqNewsletter layout="vertical" />
    </div>
  );
}