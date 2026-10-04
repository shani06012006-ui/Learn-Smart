// frontend/src/features/admin/components/AdminTopbar.jsx
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ExternalLink } from "lucide-react";

import { selectAdminUser } from "../../../store/slices/adminAuthSlice";

export default function AdminTopbar() {
  const user = useSelector(selectAdminUser);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <p className="font-display text-sm font-extrabold text-navy-950">
          Admin Console
        </p>
        <p className="text-[11px] text-slate-400">
          Signed in as{" "}
          <span className="font-semibold text-navy-950">
            {user?.email || "—"}
          </span>
        </p>
      </div>

      <Link
        to="/"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-slate-300 hover:text-navy-950"
      >
        <ExternalLink size={12} />
        View public site
      </Link>
    </header>
  );
}