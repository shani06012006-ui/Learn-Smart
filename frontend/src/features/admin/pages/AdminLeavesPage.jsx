// frontend/src/features/admin/pages/AdminLeavesPage.jsx
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GraduationCap, UserCog, ClipboardList, Clock, CheckCircle2 } from "lucide-react";

import StudentLeavesTab from "../components/leaves/StudentLeavesTab";
import TeacherLeavesTab from "../components/leaves/TeacherLeavesTab";
import LeaveReviewModal from "../components/leaves/LeaveReviewModal";

const TABS = [
  { key: "students", label: "Students", icon: GraduationCap },
  { key: "teachers", label: "Teachers", icon: UserCog },
];

export default function AdminLeavesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawType = searchParams.get("type");
  const activeType = rawType === "teachers" ? "teachers" : "students";

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalLeave, setModalLeave] = useState(null);

  const handleTabChange = (next) => {
    if (next === activeType) return;
    const params = new URLSearchParams(searchParams);
    params.set("type", next);
    setSearchParams(params, { replace: true });
  };

  const handleAction = useCallback((action, leave) => {
    setModalMode(action);
    setModalLeave(leave);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setModalMode(null);
    setModalLeave(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setModalOpen(false);
    setModalMode(null);
    setModalLeave(null);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Leaves
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and manage student and teacher leave requests.
          </p>
        </div>
      </header>

      {/* Pill tabs */}
      <div className="flex items-center gap-1.5 self-start rounded-full bg-slate-50 p-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = key === activeType;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-purple-500 text-white shadow-purple-glow"
                  : "text-slate-500 hover:text-navy-950"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeType === "students" ? (
        <StudentLeavesTab onAction={handleAction} />
      ) : (
        <TeacherLeavesTab onAction={handleAction} />
      )}

      <LeaveReviewModal
        open={modalOpen}
        mode={modalMode}
        kind={activeType === "students" ? "student" : "teacher"}
        leave={modalLeave}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}