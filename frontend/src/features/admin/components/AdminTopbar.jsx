import { useSelector } from "react-redux";

import { selectAdminUser } from "../../../store/slices/adminAuthSlice";

export default function AdminTopbar() {
  const user = useSelector(selectAdminUser);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink-200 bg-white px-6">
      <p className="text-sm font-medium text-ink-700">
        Institution Admin
      </p>
      <p className="text-xs text-ink-500">
        Signed in as{" "}
        <span className="font-medium text-ink-900">
          {user?.email || "—"}
        </span>
      </p>
    </header>
  );
}