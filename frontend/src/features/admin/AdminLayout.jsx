// frontend/src/features/admin/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";
import PageBackground from "../../components/layout/PageBackground";

export default function AdminLayout() {
  return (
    <div className="relative isolate flex h-screen overflow-hidden font-sans text-navy-950">
      {/* Fallback colour, painted below the background image */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 bg-paper-50"
      />

      {/* Shared full-screen background image */}
      <PageBackground role="admin" />

      <AdminSidebar />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}