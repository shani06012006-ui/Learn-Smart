// frontend/src/components/layout/StudentLayout.jsx
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import PageBackground from "./PageBackground";

export default function StudentLayout() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden font-sans text-navy-950">
      {/* Fallback solid colour, painted below the background image */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 bg-ink-100"
      />

      {/* Student-specific background image */}
      <PageBackground role="student" />

      <Navbar />

      <div className="relative flex">
        <Sidebar role="student" />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}