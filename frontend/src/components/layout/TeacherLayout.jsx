// frontend/src/components/layout/TeacherLayout.jsx
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import PageBackground from "./PageBackground";

export default function TeacherLayout() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden font-sans text-navy-950">
      {/* Fallback solid colour, painted below the background image */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 bg-ink-100"
      />

      {/* Shared full-screen background image — identical to admin */}
      <PageBackground role="teacher" />

      <Navbar role="teacher" />

      <div className="relative flex">
        <Sidebar role="teacher" />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}