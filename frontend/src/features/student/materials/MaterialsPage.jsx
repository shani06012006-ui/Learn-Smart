import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileText, Download } from "lucide-react";

import { useGetClassesQuery } from "../../../store/api/classesApi";
import { useGetMaterialsQuery } from "../../../store/api/materialsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";

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

  // Auto-select the first class once classes load.
  useEffect(() => {
    if (selectedClassId) return;
    if (classesQuery.data?.length > 0) {
      setSelectedClassId(classesQuery.data[0].id);
    }
  }, [classesQuery.data, selectedClassId]);

  // Keep URL in sync so deep-links work.
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
      render: (row) => (
        <span className="text-sm text-ink-700">{formatBytes(row.size_bytes)}</span>
      ),
    },
    {
      key: "uploaded_at",
      header: "Uploaded",
      render: (row) => (
        <span className="text-sm text-ink-700">{formatDate(row.uploaded_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Link
            to={`/student/materials/${row.id}`}
            className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
          >
            View Details
          </Link>
          <a
            href={row.download_url}
            onClick={(e) => e.preventDefault()}
            className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
            title="Download will be enabled when the real backend is wired up."
          >
            <Download size={14} />
            Download
          </a>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Materials</h1>
        <p className="mt-1 text-sm text-ink-500">
          Notes, PDFs, and study resources shared by your teachers.
        </p>
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
          title="You haven't joined any classes yet"
          description="Once you join a class, the materials your teacher shares will appear here."
          action={
            <Link to="/student/join-class">
              <Button>Join a class</Button>
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
                description="Your teacher hasn't shared anything for this class yet."
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
    </div>
  );
}

