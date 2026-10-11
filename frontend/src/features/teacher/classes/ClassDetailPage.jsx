import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react";

import {
  useDeleteClassMutation,
  useGetClassDetailQuery,
  useGetRosterQuery,
  useUpdateEnrollmentStatusMutation,
} from "../../../store/api/classesApi";
import { useMockPresence } from "../../../hooks/useMockPresence";
import { extractErrorMessage } from "../../../utils/apiError";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import Modal from "../../../components/ui/Modal";
import OnlineStatusBadge from "../../../components/ui/OnlineStatusBadge";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";
import AddStudentModal from "./components/AddStudentModal";
import EnrollmentStatusBadge from "./components/EnrollmentStatusBadge";

export default function ClassDetailPage() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const classQuery = useGetClassDetailQuery(classId);
  const rosterQuery = useGetRosterQuery(classId);
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateEnrollmentStatusMutation();
  const [deleteClass, { isLoading: isDeleting }] = useDeleteClassMutation();

  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingActionId, setPendingActionId] = useState(null);

  const studentIds = useMemo(
    () => (rosterQuery.data || []).map((e) => e.student.id),
    [rosterQuery.data]
  );
  const initialPresence = useMemo(
    () =>
      Object.fromEntries((rosterQuery.data || []).map((e) => [e.student.id, e.student.is_online])),
    [rosterQuery.data]
  );
  const presence = useMockPresence(studentIds, initialPresence);

  const handleStatusChange = async (enrollmentId, status) => {
    setPendingActionId(enrollmentId);
    try {
      await updateStatus({ classId, enrollmentId, status }).unwrap();
    } finally {
      setPendingActionId(null);
    }
  };

  const handleDelete = async () => {
    await deleteClass(classId).unwrap();
    navigate("/teacher/classes");
  };

  if (classQuery.isLoading) return <LoadingState label="Loading class..." />;
  if (classQuery.isError) {
    return (
      <ErrorState
        message={extractErrorMessage(classQuery.error)}
        onRetry={classQuery.refetch}
      />
    );
  }

  const cls = classQuery.data;

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.student.full_name}</p>
          <p className="text-xs text-ink-500">{row.student.email}</p>
        </div>
      ),
    },
    {
      key: "online",
      header: "Presence",
      render: (row) => <OnlineStatusBadge isOnline={presence[row.student.id]} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <EnrollmentStatusBadge status={row.status} />,
    },
    {
      key: "joining_code",
      header: "Joining code",
      render: (row) => <span className="font-mono text-xs">{row.joining_code}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const busy = isUpdatingStatus && pendingActionId === row.id;
        if (row.status === "blocked") {
          return (
            <Button
              size="sm"
              variant="secondary"
              loading={busy}
              onClick={() => handleStatusChange(row.id, "active")}
            >
              Unblock
            </Button>
          );
        }
        if (row.status === "removed") {
          return <span className="text-xs text-ink-500">Removed</span>;
        }
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              loading={busy}
              onClick={() => handleStatusChange(row.id, "blocked")}
            >
              Block
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={busy}
              onClick={() => handleStatusChange(row.id, "removed")}
            >
              Remove
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <Link
        to="/teacher/classes"
        className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700"
      >
        <ArrowLeft size={16} />
        Back to classes
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{cls.subject}</p>
          <h1 className="mt-0.5 text-xl font-semibold text-ink-900">{cls.name}</h1>
          {cls.description && <p className="mt-1 max-w-xl text-sm text-ink-500">{cls.description}</p>}
          <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
            <Users size={16} />
            {cls.student_count} {cls.student_count === 1 ? "student" : "students"}
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirmOpen(true)}>
            <Trash2 size={16} />
            Delete class
          </Button>
          <Button onClick={() => setAddStudentOpen(true)}>
            <Plus size={16} />
            Add student
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-1">
        {rosterQuery.isLoading && <LoadingState label="Loading roster..." />}

        {rosterQuery.isError && (
          <ErrorState message={extractErrorMessage(rosterQuery.error)} onRetry={rosterQuery.refetch} />
        )}

        {!rosterQuery.isLoading && !rosterQuery.isError && rosterQuery.data?.length === 0 && (
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Add students to generate their joining codes."
            action={<Button onClick={() => setAddStudentOpen(true)}>Add your first student</Button>}
          />
        )}

        {!rosterQuery.isLoading && !rosterQuery.isError && rosterQuery.data?.length > 0 && (
          <Table columns={columns} data={rosterQuery.data} />
        )}
      </div>

      <AddStudentModal
        open={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        classId={classId}
      />

      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete this class?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
              Delete class
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700">
          This removes <span className="font-medium">{cls.name}</span> from your class
          list. Student records and past grades aren't permanently erased — an
          institution admin can still recover it if needed.
        </p>
      </Modal>
    </div>
  );
}
