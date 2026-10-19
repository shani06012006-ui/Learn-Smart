// frontend/src/components/layout/StudentLayout.jsx
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import PageBackground from "./PageBackground";

export default function StudentLayout() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden font-sans text-navy-950">
      {/* Full-bleed background — covers navbar + sidebar + main content */}
      <PageBackground role="student" />

      {/* Navbar (make it transparent so the image shows through) */}
      <Navbar role="student" />

      <div className="relative flex">
        <Sidebar role="student" />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-5 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}