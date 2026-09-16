import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function TeacherLayout() {
  return (
    <div className="min-h-screen bg-ink-100">
      <Navbar />
      <div className="flex">
        <Sidebar role="teacher" />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
