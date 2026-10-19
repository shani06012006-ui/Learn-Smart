// frontend/src/features/teacher/components/quizzes/CreateQuizModal.jsx
import { useEffect, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import PdfUploader from "./PdfUploader";
import AiReviewStudio from "./AiReviewStudio";
import { classLabel } from "./classLabel";
import {
  useGetClassesQuery,
  useGetGradesQuery,
  useGenerateQuizFromPdfMutation,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  usePublishQuizMutation,
  useUnpublishQuizMutation,
} from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "mixed", label: "Mixed" },
];

const COUNTS = [5, 10, 15, 20];

export default function CreateQuizModal({
  open,
  onClose,
  onCreated,
  quiz = null,
}) {
  const isEdit = Boolean(quiz);

  const { data: classesData } = useGetClassesQuery();
  const allClasses = classesData?.results ?? classesData ?? [];

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  const [step, setStep] = useState(1);
  const [gradeId, setGradeId] = useState("");
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [passing, setPassing] = useState(60);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("mixed");
  const [file, setFile] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  const [generate, { isLoading: generating }] = useGenerateQuizFromPdfMutation();
  const [createQuiz, { isLoading: saving }] = useCreateQuizMutation();
  const [updateQuiz, { isLoading: updating }] = useUpdateQuizMutation();
  const [publishQuiz] = usePublishQuizMutation();
  const [unpublishQuiz] = useUnpublishQuizMutation();

  // 👇 AUTO-SELECT CLASS BEHIND THE SCENES
  // When the user picks a grade, grab the first class in that grade.
  useEffect(() => {
    if (!gradeId) {
      setClassId("");
      return;
    }
    const classesInGrade = allClasses.filter(
      (c) => String(c.grade?.id) === String(gradeId)
    );
    if (classesInGrade.length > 0) {
      setClassId(classesInGrade[0].id);
    } else {
      setClassId("");
    }
  }, [gradeId, allClasses]);

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    if (isEdit && quiz) {
      setGradeId(quiz.class_course?.grade?.id || quiz.grade?.id || "");
      setClassId(quiz.class_course || quiz.class_id || "");
      setTitle(quiz.title || "");
      setDuration(quiz.duration_minutes || 30);
      setPassing(quiz.passing_score || 60);
      setDifficulty(quiz.difficulty || "mixed");
      setCount(quiz.questions?.length || 10);
      setQuestions(
        (quiz.questions || []).map((q) => ({
          question_text: q.question_text,
          explanation: q.explanation || "",
          points: q.points || 1,
          choices: (q.choices || []).map((c) => ({
            choice_text: c.choice_text,
            is_correct: !!c.is_correct,
          })),
        }))
      );
      setStep(2);
    } else {
      setGradeId("");
      setClassId("");
      setTitle("");
      setDuration(30);
      setPassing(60);
      setCount(10);
      setDifficulty("mixed");
      setFile(null);
      setQuestions([]);
      setStep(1);
    }
    setError("");
  }, [open, isEdit, quiz]);

  const close = () => {
    onClose();
  };

  const onGenerate = async () => {
    setError("");
    if (!classId || !title.trim() || !file) {
      setError("Please select a grade, enter a title, and pick a PDF.");
      return;
    }
    const fd = new FormData();
    fd.append("pdf", file);
    fd.append("class_course", classId);
    fd.append("title", title.trim());
    fd.append("duration_minutes", String(duration));
    fd.append("passing_score", String(passing));
    fd.append("question_count", String(count));
    fd.append("difficulty", difficulty);

    try {
      const res = await generate(fd).unwrap();
      const qs = (res.questions || []).map((q) => ({
        question_text: q.question_text,
        explanation: q.explanation || "",
        points: q.points || 1,
        choices: (q.choices || []).map((c) => ({
          choice_text: c.choice_text,
          is_correct: !!c.is_correct,
        })),
      }));
      setQuestions(qs);
      setStep(2);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const buildPayload = () => ({
    title: title.trim(),
    class_course: classId,
    duration_minutes: Number(duration),
    passing_score: Number(passing),
    difficulty,
    source_filename: file?.name || quiz?.source_filename || "",
    questions: questions.map((q, i) => ({
      question_text: q.question_text,
      explanation: q.explanation || "",
      points: q.points || 1,
      order: i,
      choices: q.choices.map((c, ci) => ({
        choice_text: c.choice_text,
        is_correct: !!c.is_correct,
        order: ci,
      })),
    })),
  });

  const onSaveDraft = async () => {
    setError("");
    try {
      if (isEdit) {
        await updateQuiz({ id: quiz.id, ...buildPayload() }).unwrap();
      } else {
        await createQuiz(buildPayload()).unwrap();
      }
      onCreated?.();
      close();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const onSaveAndPublish = async () => {
    setError("");
    try {
      if (isEdit) {
        await updateQuiz({ id: quiz.id, ...buildPayload() }).unwrap();
        await publishQuiz(quiz.id).unwrap();
      } else {
        const created = await createQuiz(buildPayload()).unwrap();
        await publishQuiz(created.id).unwrap();
      }
      onCreated?.();
      close();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const onUnpublish = async () => {
    if (!isEdit) return;
    setError("");
    try {
      await updateQuiz({ id: quiz.id, ...buildPayload() }).unwrap();
      await unpublishQuiz(quiz.id).unwrap();
      onCreated?.();
      close();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const onRegenerateQuestion = (_idx) => {};

  const editingPublished = isEdit && quiz?.is_published;

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title={
        isEdit
          ? `Edit Quiz — ${quiz?.title || ""}`
          : step === 1
          ? "Create Quiz via AI"
          : "Review & Edit"
      }
    >
      {error && (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {!isEdit && step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            
            {/* 👇 ONLY GRADE DROPDOWN (No Class) */}
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Grade
              </span>
              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                <option value="">Select a grade…</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Quiz title
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 3 recap"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Time limit (minutes)
              </span>
              <input
                type="number"
                min={5}
                max={180}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Passing score (%)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={passing}
                onChange={(e) => setPassing(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Number of questions
            </span>
            <div className="flex flex-wrap gap-2">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition " +
                    (count === n
                      ? "bg-purple-500 text-white shadow-purple-glow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Difficulty
            </span>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition " +
                    (difficulty === d.value
                      ? "bg-purple-500 text-white shadow-purple-glow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Source PDF
            </span>
            <PdfUploader file={file} onChange={setFile} disabled={generating} />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <Button variant="secondary" onClick={close} disabled={generating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onGenerate} disabled={generating}>
              <Sparkles size={14} className={generating ? "animate-pulse" : ""} />
              {generating ? "Generating…" : "Generate Quiz with AI"}
            </Button>
          </div>
        </div>
      )}

      {(isEdit || step === 2) && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Title
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Grade
              </span>
              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select a grade…</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Duration (min)
              </span>
              <input
                type="number"
                min={5}
                max={180}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Passing score (%)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={passing}
                onChange={(e) => setPassing(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <AiReviewStudio
            title={title}
            questions={questions}
            onQuestionsChange={setQuestions}
            onSaveDraft={onSaveDraft}
            onPublish={onSaveAndPublish}
            onUnpublish={editingPublished ? onUnpublish : null}
            saving={saving || updating}
            publishing={saving || updating}
            saveLabel={isEdit ? "Update Quiz" : "Save as Draft"}
            publishLabel={isEdit ? "Update & Publish" : "Publish to Students"}
            onRegenerateQuestion={onRegenerateQuestion}
          />
        </div>
      )}
    </Modal>
  );
}