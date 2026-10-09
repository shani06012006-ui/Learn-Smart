import { useMemo, useState } from "react";
import {
  Brain,
  Plus,
  Search,
  Pencil,
  Send,
  Trash2,
  Eye,
  BookOpen,
  FileText,
  Users,
  TrendingUp,
  Archive,
} from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Button from "../../../components/ui/Button";
import CreateQuizModal from "../components/quizzes/CreateQuizModal";
import { classShortLabel } from "../components/quizzes/classLabel";
import {
  useGetQuizzesQuery,
  useGetClassesQuery,
  useDeleteQuizMutation,
  usePublishQuizMutation,
  useUnpublishQuizMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

function MetricCard({ icon: Icon, label, value, tone = "purple" }) {
  const tones = {
    purple: "bg-purple-50 text-purple-600",
    mint: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    coral: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <span className={"flex h-8 w-8 items-center justify-center rounded-lg " + tones[tone]}>
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold text-navy-950">
        {value}
      </p>
    </div>
  );
}

function QuizCard({ quiz, onEdit, onDelete, onPublish, onUnpublish, onPreview }) {
  const published = quiz.is_published;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:shadow-elevated">
      <div className="flex items-start justify-between gap-2">
        <span
          className={
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 " +
            (published
              ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
              : "bg-amber-50 text-amber-600 ring-amber-100")
          }
        >
          {published ? "Published" : "Draft"}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {quiz.difficulty}
        </span>
      </div>

      <div>
        <h3 className="line-clamp-2 font-display text-sm font-extrabold text-navy-950">
          {quiz.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-slate-600">
          {quiz.class_name}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <BookOpen size={11} /> {quiz.question_count || 0} Q
        </span>
        <span className="inline-flex items-center gap-1">
          <FileText size={11} /> {quiz.total_marks || 0} pts
        </span>
        <span className="inline-flex items-center gap-1">
          <TrendingUp size={11} /> {quiz.duration_minutes}m
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-1 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => onPreview(quiz)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100"
        >
          <Eye size={12} /> Preview
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(quiz)}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
            title="Edit"
          >
            <Pencil size={12} /> Edit
          </button>
          {published ? (
            <button
              type="button"
              onClick={() => onUnpublish(quiz)}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-600 hover:bg-amber-100"
              title="Unpublish (set to draft)"
            >
              <Archive size={12} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onPublish(quiz)}
              className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-600 hover:bg-purple-100"
              title="Publish"
            >
              <Send size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(quiz)}
            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherQuizzesPage() {
  const [status, setStatus] = useState("");
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editQuiz, setEditQuiz] = useState(null);

  const { data: classesData } = useGetClassesQuery();
  const classes = classesData?.results ?? classesData ?? [];

  const queryParams = useMemo(() => {
    const p = {};
    if (status) p.status = status;
    if (classId) p.class_course = classId;
    if (search.trim()) p.q = search.trim();
    return p;
  }, [status, classId, search]);

  const { data, isLoading, isError, error, refetch } =
    useGetQuizzesQuery(queryParams);

  const quizzes = data?.results ?? data ?? [];

  const [deleteQuiz] = useDeleteQuizMutation();
  const [publishQuiz] = usePublishQuizMutation();
  const [unpublishQuiz] = useUnpublishQuizMutation();

  const metrics = useMemo(() => {
    const total = quizzes.length;
    const published = quizzes.filter((q) => q.is_published).length;
    const totalQuestions = quizzes.reduce(
      (sum, q) => sum + (q.question_count || 0),
      0
    );
    const avgDuration = total
      ? Math.round(
          quizzes.reduce((s, q) => s + (q.duration_minutes || 0), 0) / total
        )
      : 0;
    return { total, published, totalQuestions, avgDuration };
  }, [quizzes]);

  const handleDelete = async (quiz) => {
    if (!window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return;
    try {
      await deleteQuiz(quiz.id).unwrap();
    } catch (e) {
      alert(extractErrorMessage(e));
    }
  };

  const handlePublish = async (quiz) => {
    try {
      await publishQuiz(quiz.id).unwrap();
    } catch (e) {
      alert(extractErrorMessage(e));
    }
  };

  const handleUnpublish = async (quiz) => {
    if (!window.confirm(`Unpublish "${quiz.title}"? It will become a draft.`)) return;
    try {
      await unpublishQuiz(quiz.id).unwrap();
    } catch (e) {
      alert(extractErrorMessage(e));
    }
  };

  const handlePreview = (quiz) => {
    alert(
      `Preview: ${quiz.title}\n${quiz.question_count} questions\n${quiz.duration_minutes} minutes`
    );
  };

  const handleEdit = (quiz) => {
    setEditQuiz(quiz);
  };

  const closeEdit = () => setEditQuiz(null);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Quizzes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create AI-powered quizzes from PDFs and manage your library.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Create Quiz
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Brain} label="Total Quizzes" value={metrics.total} tone="purple" />
        <MetricCard icon={Send} label="Published" value={metrics.published} tone="mint" />
        <MetricCard icon={Users} label="Total Questions" value={metrics.totalQuestions} tone="amber" />
        <MetricCard icon={TrendingUp} label="Avg Duration (min)" value={metrics.avgDuration} tone="coral" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classShortLabel(c)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-full bg-slate-50 p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatus(t.value)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-bold transition " +
                (status === t.value
                  ? "bg-purple-500 text-white shadow-purple-glow"
                  : "text-slate-500 hover:text-navy-950")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingState label="Loading quizzes…" />}
      {isError && <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />}

      {!isLoading && !isError && quizzes.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <Brain size={26} />
          </span>
          <h2 className="font-display text-xl font-extrabold text-navy-950">
            No quizzes yet
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            Create your first AI-powered quiz from a PDF in seconds.
          </p>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create Quiz
          </Button>
        </div>
      )}

      {!isLoading && !isError && quizzes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <QuizCard
              key={q.id}
              quiz={q}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onPreview={handlePreview}
            />
          ))}
        </div>
      )}

      <CreateQuizModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => refetch()}
      />

      <CreateQuizModal
        open={Boolean(editQuiz)}
        onClose={closeEdit}
        quiz={editQuiz}
        onCreated={() => {
          closeEdit();
          refetch();
        }}
      />
    </div>
  );
}