import { Outlet } from "react-router-dom";

import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-ink-100">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}