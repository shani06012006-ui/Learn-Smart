import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, FileText, Download, Trash2 } from "lucide-react";

import { useGetClassesQuery } from "../../../store/api/classesApi";
import {
  useGetMaterialsQuery,
  useDeleteMaterialMutation,
} from "../../../store/api/materialsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import Modal from "../../../components/ui/Modal";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";
import UploadMaterialModal from "./components/UploadMaterialModal";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MaterialsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const classesQuery = useGetClassesQuery();

  const [selectedClassId, setSelectedClassId] = useState(searchParams.get("class") || "");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [deleteMaterial, { isLoading: isDeleting }] = useDeleteMaterialMutation();

  // Pick a default class once classes load, if none selected.
  useEffect(() => {
    if (selectedClassId) return;
    if (classesQuery.data?.length > 0) {
      setSelectedClassId(classesQuery.data[0].id);
    }
  }, [classesQuery.data, selectedClassId]);

  // Keep URL in sync with selected class (deep-linkable).
  useEffect(() => {
    if (!selectedClassId) return;
    const current = searchParams.get("class");
    if (current !== selectedClassId) {
      const next = new URLSearchParams(searchParams);
      next.set("class", selectedClassId);
      setSearchParams(next, { replace: true });
    }
  }, [selectedClassId, searchParams, setSearchParams]);

  const materialsQuery = useGetMaterialsQuery(selectedClassId, { skip: !selectedClassId });

  const handleDelete = async () => {
    try {
      await deleteMaterial({ materialId: deleteTarget.id, classId: selectedClassId }).unwrap();
    } finally {
      setDeleteTarget(null);
    }
  };

  const classes = classesQuery.data || [];

  const columns = [
    {
      key: "title",
      header: "Material",
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.title}</p>
          <p className="text-xs text-ink-500">{row.original_filename}</p>
        </div>
      ),
    },
    {
      key: "size",
      header: "Size",
      render: (row) => <span className="text-sm text-ink-700">{formatBytes(row.size_bytes)}</span>,
    },
    {
      key: "uploaded_at",
      header: "Uploaded",
      render: (row) => <span className="text-sm text-ink-700">{formatDate(row.uploaded_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <a
            href={row.download_url}
            onClick={(e) => e.preventDefault()}
            className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
            title="Download (mocked — see note below)"
          >
            <Download size={14} />
            Download
          </a>
          <button
            onClick={() => setDeleteTarget(row)}
            className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-danger-700 hover:bg-danger-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Materials</h1>
          <p className="mt-1 text-sm text-ink-500">
            Upload notes, PDFs, and study resources for your classes.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} disabled={!selectedClassId}>
          <Plus size={16} />
          Upload material
        </Button>
      </div>

      {classesQuery.isLoading && <LoadingState label="Loading your classes..." />}

      {classesQuery.isError && (
        <ErrorState
          message={extractErrorMessage(classesQuery.error)}
          onRetry={classesQuery.refetch}
        />
      )}

      {!classesQuery.isLoading && !classesQuery.isError && classes.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No classes yet"
          description="Create a class first, then upload materials to it."
          action={
            <Link to="/teacher/classes">
              <Button>Go to Classes</Button>
            </Link>
          }
        />
      )}

      {!classesQuery.isLoading && !classesQuery.isError && classes.length > 0 && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <label htmlFor="class-select" className="text-sm font-medium text-ink-700">
              Class
            </label>
            <select
              id="class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} — {cls.subject}
                </option>
              ))}
            </select>
          </div>

          {materialsQuery.isLoading && <LoadingState label="Loading materials..." />}

          {materialsQuery.isError && (
            <ErrorState
              message={extractErrorMessage(materialsQuery.error)}
              onRetry={materialsQuery.refetch}
            />
          )}

          {!materialsQuery.isLoading &&
            !materialsQuery.isError &&
            materialsQuery.data?.length === 0 && (
              <EmptyState
                icon={FileText}
                title="No materials yet"
                description="Upload the first study resource for this class."
                action={
                  <Button onClick={() => setUploadOpen(true)}>Upload material</Button>
                }
              />
            )}

          {!materialsQuery.isLoading &&
            !materialsQuery.isError &&
            materialsQuery.data?.length > 0 && (
              <div className="rounded-xl bg-white p-1">
                <Table columns={columns} data={materialsQuery.data} />
              </div>
            )}
        </>
      )}

      <UploadMaterialModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        classId={selectedClassId}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this material?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700">
          <span className="font-medium">{deleteTarget?.title}</span> will be removed
          from the class. Students will no longer see it in their materials list.
        </p>
      </Modal>
    </div>
  );
}
