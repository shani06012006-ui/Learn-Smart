import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  User,
  BookOpen,
  HardDrive,
  ChevronRight,
  FileType,
} from "lucide-react";

import {
  useGetMaterialQuery,
  useGetMaterialsQuery,
} from "../../store/api/materialsApi";
import { useGetClassesQuery } from "../../store/api/classesApi";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import LoadingState from "../../components/feedback/LoadingState";
import ErrorState from "../../components/feedback/ErrorState";
import { extractErrorMessage } from "../../utils/apiError";

// Pick a lucide icon + tint for a material based on its mime type.
// Returns a small config object so the hero tile and the related-material
// list both render consistently from the same source of truth.
function iconForMaterial(mimeType) {
  if (!mimeType) return { Icon: FileText, tone: "brand" };
  if (mimeType.includes("pdf")) return { Icon: FileText, tone: "danger" };
  if (mimeType.includes("image")) return { Icon: FileText, tone: "success" };
  if (mimeType.includes("word") || mimeType.includes("document"))
    return { Icon: FileText, tone: "brand" };
  return { Icon: FileText, tone: "brand" };
}

// Short human label for the file type, derived from mime + filename.
function typeLabel(mimeType, filename) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType?.includes("image")) {
    const ext = filename?.split(".").pop()?.toUpperCase();
    return ext || "Image";
  }
  if (mimeType?.includes("word")) return "Document";
  if (filename?.includes(".")) return filename.split(".").pop().toUpperCase();
  return "File";
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso, opts = {}) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...opts,
  });
}

const TONE_BG = {
  brand: "bg-brand-50 text-brand-600",
  danger: "bg-danger-50 text-danger-700",
  success: "bg-success-50 text-success-700",
};

export default function MaterialDetailPage() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.pathname.startsWith("/teacher") ? "/teacher" : "/student";

  const materialQuery = useGetMaterialQuery(materialId);
  const classesQuery = useGetClassesQuery();

  const material = materialQuery.data;
  const materialClass = material
    ? (classesQuery.data || []).find((c) => c.id === material.class_id)
    : null;

  // Sibling materials from the same class. We fetch the list once we know
  // the class id; excluded the current material from the "related" view.
  const siblingsQuery = useGetMaterialsQuery(material?.class_id, {
    skip: !material?.class_id,
  });
  const related = (siblingsQuery.data || [])
    .filter((m) => m.id !== materialId)
    .slice(0, 3);

  if (materialQuery.isLoading) {
    return <LoadingState label="Loading material..." />;
  }

  if (materialQuery.isError) {
    return (
      <ErrorState
        message={extractErrorMessage(materialQuery.error)}
        onRetry={materialQuery.refetch}
      />
    );
  }

  if (!material) {
    return (
      <div className="text-center">
        <p className="text-sm text-ink-500">This material was not found.</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => navigate(`${prefix}/materials`)}
        >
          Back to Materials
        </Button>
      </div>
    );
  }

  const { Icon, tone } = iconForMaterial(material.mime_type);
  const type = typeLabel(material.mime_type, material.original_filename);
  const className = materialClass?.name || "Class";
  const classSubject = materialClass?.subject;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-xs text-ink-500"
      >
        <Link
          to={`${prefix}/materials`}
          className="focus-ring rounded-sm px-1 py-0.5 transition-colors hover:text-ink-900"
        >
          Materials
        </Link>
        <ChevronRight size={12} className="shrink-0 text-ink-400" />
        <span className="truncate text-ink-700">{className}</span>
        <ChevronRight size={12} className="shrink-0 text-ink-400" />
        <span className="truncate font-medium text-ink-900">{material.title}</span>
      </nav>

      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(`${prefix}/materials`)}
        className="focus-ring mb-6 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
      >
        <ArrowLeft size={14} />
        Back to Materials
      </button>

      {/* Hero */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem] lg:gap-12">
        {/* Left column: title + description + metadata */}
        <div>
          <div className="mb-5 flex items-start gap-4">
            <div
              className={
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl " +
                TONE_BG[tone]
              }
            >
              <Icon size={30} />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{type}</Badge>
                <span className="text-xs text-ink-500">
                  {formatBytes(material.size_bytes)}
                </span>
              </div>
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-3xl">
                {material.title}
              </h1>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={14} className="text-ink-400" />
              {className}
              {classSubject ? ` · ${classSubject}` : ""}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-ink-400" />
              {formatDate(material.uploaded_at)}
            </span>
          </div>

          {material.description && (
            <div className="prose-sm max-w-none text-sm leading-relaxed text-ink-700">
              <p>{material.description}</p>
            </div>
          )}

          {/* Metadata table */}
          <div className="mt-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Details
            </h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              <Meta icon={FileType} label="File name" value={material.original_filename} />
              <Meta icon={FileType} label="Type" value={type} />
              <Meta
                icon={HardDrive}
                label="Size"
                value={formatBytes(material.size_bytes)}
              />
              <Meta
                icon={Calendar}
                label="Uploaded"
                value={formatDate(material.uploaded_at)}
              />
            </dl>
          </div>
        </div>

        {/* Right column: action card + author */}
        <aside>
          <Card className="sticky top-4 p-5">
            <div className="mb-4 flex items-center gap-3 border-b border-ink-200 pb-4">
              <Avatar
                userId={material.uploaded_by_id}
                initials={material.uploaded_by_initials}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  Shared by
                </p>
                <p className="truncate text-sm font-semibold text-ink-900">
                  {material.uploaded_by_name}
                </p>
              </div>
            </div>

            <a
              href={material.download_url}
              onClick={(e) => e.preventDefault()}
              className="block"
              title="Download will be enabled when the real backend is wired up."
            >
              <Button size="lg" className="w-full">
                <Download size={16} />
                Download
              </Button>
            </a>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-500">
              {formatBytes(material.size_bytes)} · {type}
            </p>
          </Card>
        </aside>
      </div>

      {/* Related materials */}
      {related.length > 0 && (
        <section className="mt-14 border-t border-ink-200 pt-10">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">
            More from {className}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((m) => {
              const rel = iconForMaterial(m.mime_type);
              const RelIcon = rel.Icon;
              return (
                <Link
                  key={m.id}
                  to={`${prefix}/materials/${m.id}`}
                  className="focus-ring group block rounded-xl border border-ink-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
                        TONE_BG[rel.tone]
                      }
                    >
                      <RelIcon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {m.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {formatBytes(m.size_bytes)} ·{" "}
                        {typeLabel(m.mime_type, m.original_filename)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-ink-400" />
      <div className="min-w-0">
        <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
          {label}
        </dt>
        <dd className="mt-0.5 truncate text-sm text-ink-900" title={value}>
          {value}
        </dd>
      </div>
    </div>
  );
}
