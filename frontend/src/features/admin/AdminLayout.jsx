// frontend/src/features/admin/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";
import PageBackground from "../../components/layout/PageBackground";

export default function AdminLayout() {
  return (
<div className="relative isolate flex h-screen overflow-hidden font-sans text-navy-950">
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 -z-20 bg-paper-50"
  />
  <PageBackground />

  <AdminSidebar />

  <div className="relative flex min-w-0 flex-1 flex-col">
    <AdminTopbar />
    <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <Outlet />
      </div>
    </main>
  </div>
</div>
  );
}