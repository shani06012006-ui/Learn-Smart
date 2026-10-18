// frontend/src/features/landing/sections/HorizontalStoryboard.jsx
import Panel1Hero from "./Panel1Hero";
import Panel2Stats from "./Panel2Stats";
import Panel3Map from "./Panel3Map";
import Panel4Testimonials from "./Panel4Testimonials";
import Panel5FaqNewsletter from "./Panel5FaqNewsletter";

export default function HorizontalStoryboard() {
  return (
    <div className="relative w-full">
      <Panel1Hero layout="vertical" />
      <Panel2Stats layout="vertical" />
      <Panel3Map layout="vertical" />
      <Panel4Testimonials layout="vertical" />
      <Panel5FaqNewsletter layout="vertical" />
    </div>
  );
}