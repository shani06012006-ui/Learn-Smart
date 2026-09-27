import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageHeader from "../../../components/ui/PageHeader";
import StudentLeavesTab from "../components/leaves/StudentLeavesTab";
import TeacherLeavesTab from "../components/leaves/TeacherLeavesTab";
import LeaveReviewModal from "../components/leaves/LeaveReviewModal";

const TABS = [
  { key: "students", label: "Students" },
  { key: "teachers", label: "Teachers" },
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
    // RTK Query tag invalidation refreshes the active table + any pending
    // count consumers. We only need to close the modal.
    setModalOpen(false);
    setModalMode(null);
    setModalLeave(null);
  }, []);

  return (
    <div>
      <PageHeader
        title="Leaves"
        subtitle="Review and manage student and teacher leave requests."
      />

      <div className="mb-6 flex items-center gap-2 border-b border-ink-200">
        {TABS.map((tab) => {
          const isActive = tab.key === activeType;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={
                "focus-ring -mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
                (isActive
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-ink-600 hover:text-ink-900")
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

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