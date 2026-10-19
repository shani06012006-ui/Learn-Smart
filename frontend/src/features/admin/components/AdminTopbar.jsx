// frontend/src/features/admin/components/AdminTopbar.jsx
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ExternalLink } from "lucide-react";

import { selectAdminUser } from "../../../store/slices/adminAuthSlice";

export default function AdminTopbar() {
  const user = useSelector(selectAdminUser);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/60 px-6 backdrop-blur-md">
      <div>
        <p className="font-display text-sm font-extrabold text-black-100">
          Admin Console
        </p>
        <p className="text-[11px] text-slate-500">
          Signed in as{" "}
          <span className="font-bold text-black-200">
            {user?.email || "—"}
          </span>
        </p>
      </div>

      <Link
        to="/"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-red-700 bg-black px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700/70 hover:text-white"
      >
        <ExternalLink size={12} />
        View public site
      </Link>
    </header>
  );
}