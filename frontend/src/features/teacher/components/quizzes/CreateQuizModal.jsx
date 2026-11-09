// frontend/src/features/teacher/components/quizzes/CreateQuizModal.jsx
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, FileText, Plus, Trash2, AlertCircle, CheckCircle2, ChevronRight, X,
  UploadCloud, PenLine, Wand2, ArrowLeft, ArrowRight, Check, RefreshCw, Send,
} from "lucide-react";
import {
  useGetClassesQuery,
  useGenerateQuizFromPdfMutation,
  useCreateQuizMutation,
  usePublishQuizMutation,
} from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";
import { classShortLabel } from "./classLabel";

// ---------------------------------------------------------------------------
// Pookie theme: soft pastel pinks, lilacs and mints
// ---------------------------------------------------------------------------
const T = {
  card: "#FFFFFF",
  surface: "#FFF7FB",
  ink: "#4B2A4F",
  muted: "#9C7DA3",
  pink: "#FF8FC7",
  pinkDeep: "#EC4C94",
  lilac: "#C9B6FF",
  mint: "#A8F0D6",
  mintDeep: "#1FA47A",
  peach: "#FFD9B8",
  border: "#F4DCEB",
  gradient: "linear-gradient(135deg, #FF8FC7 0%, #C9B6FF 100%)",
  glow: "0 12px 28px -10px rgba(236, 76, 148, 0.55)",
};

const HEAD_FONT = "'Baloo 2', 'Nunito', system-ui, sans-serif";
const BODY_FONT = "'Nunito', system-ui, sans-serif";

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;700;800&display=swap');
@keyframes pookie-pop { 0% { transform: scale(.94); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes pookie-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes pookie-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes pookie-wiggle { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } }
`;

const STEPS = [
  { id: 1, label: "Setup", icon: Sparkles },
  { id: 2, label: "Source", icon: UploadCloud },
  { id: 3, label: "Questions", icon: PenLine },
  { id: 4, label: "Publish", icon: Send },
];

const COUNTS = [5, 10, 15, 20];
const LETTERS = ["A", "B", "C", "D"];
const GENERATING_MESSAGES = [
  "Reading your PDF…",
  "Finding the key ideas…",
  "Writing fair but tricky questions…",
  "Adding plausible wrong answers…",
];

const blankQuestion = () => ({
  text: "",
  options: ["", "", "", ""],
  correct: 0,
  explanation: "",
});

// Returns an error message, or "" if every question is publishable.
function validateQuestions(questions) {
  if (questions.length === 0) return "Add at least one question first.";
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.text.trim()) return `Question ${i + 1} has no text yet.`;
    if (q.options.some((o) => !o.trim())) {
      return `Question ${i + 1} needs all four options filled in.`;
    }
  }
  return "";
}

// Shared style helpers
const pill = (active) => ({
  background: active ? T.gradient : "#FFFFFF",
  color: active ? "#FFFFFF" : T.ink,
  border: `2px solid ${active ? "transparent" : T.border}`,
  boxShadow: active ? T.glow : "none",
});

const fieldStyle = {
  background: T.surface,
  border: `2px solid ${T.border}`,
  color: T.ink,
  fontFamily: BODY_FONT,
};

export default function CreateQuizModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [creationType, setCreationType] = useState(null); // "ai" | "manual"
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const { data: classesData, isError: classesError } = useGetClassesQuery();
  const classOptions = classesData?.results ?? classesData ?? [];
  const selectedClass = classOptions.find((c) => c.id === classId);

  const [generateQuizFromPdf] = useGenerateQuizFromPdfMutation();
  const [createQuiz, { isLoading: isCreating }] = useCreateQuizMutation();
  const [publishQuiz, { isLoading: isPublishing }] = usePublishQuizMutation();
  const isSaving = isCreating || isPublishing;

  // Reset everything when the modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setCreationType(null);
      setClassId("");
      setTitle("");
      setFile(null);
      setQuestions([]);
      setActiveIdx(0);
      setQuestionCount(10);
      setIsGenerating(false);
      setMsgIdx(0);
      setError("");
    }
  }, [open]);

  // Rotate the loading message while the AI works
  useEffect(() => {
    if (!isGenerating) return;
    const t = setInterval(
      () => setMsgIdx((i) => (i + 1) % GENERATING_MESSAGES.length),
      2200
    );
    return () => clearInterval(t);
  }, [isGenerating]);

  // --- Validation ---

  const validateDetails = () => {
    if (!classId) return "Pick a class to continue.";
    if (!title.trim()) return "Give your quiz a title.";
    return "";
  };

  // --- Step 1 ---

  const goNextFromStep1 = () => {
    const problem = validateDetails();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    if (creationType === "ai") {
      setStep(2);
    } else {
      setQuestions([blankQuestion()]);
      setActiveIdx(0);
      setStep(3);
    }
  };

  // --- Step 2 (AI) ---

  const acceptFile = (f) => {
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("That doesn't look like a PDF. Please choose a .pdf file.");
      return;
    }
    setError("");
    setFile(f);
    setQuestions([]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const clearFile = () => {
    setFile(null);
    setQuestions([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runAiGeneration = async () => {
    if (!file) {
      setError("Upload a PDF first.");
      return;
    }
    setError("");
    setIsGenerating(true);
    setMsgIdx(0);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("class_course", classId);
      formData.append("title", title.trim());
      formData.append("question_count", String(questionCount));
      formData.append("duration_minutes", "30");
      formData.append("passing_score", "60");
      formData.append("difficulty", "mixed");

      const res = await generateQuizFromPdf(formData).unwrap();

      const generated = (res.questions ?? []).map((q) => {
        const choices = q.choices ?? [];
        const correctIdx = choices.findIndex((c) => c.is_correct);
        return {
          text: q.question_text ?? "",
          options: choices.map((c) => c.choice_text ?? ""),
          correct: correctIdx >= 0 ? correctIdx : 0,
          explanation: q.explanation ?? "",
        };
      });

      if (generated.length === 0) {
        setError("The AI returned no questions. Try a different PDF.");
        return;
      }

      setQuestions(generated);
      setActiveIdx(0);
    } catch (err) {
      console.error("AI generation error:", err);
      if (err?.status === 401) {
        setError("Your session expired. Please log out and log back in.");
      } else {
        setError(extractErrorMessage(err) || "AI generation failed. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Step 3 (editor) ---

  const activeQuestion = questions[activeIdx];

  const patchActive = (patch) =>
    setQuestions((qs) => qs.map((q, i) => (i === activeIdx ? { ...q, ...patch } : q)));

  const patchOption = (optIdx, value) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === activeIdx
          ? { ...q, options: q.options.map((o, j) => (j === optIdx ? value : o)) }
          : q
      )
    );

  const addQuestion = () => {
    setQuestions((qs) => [...qs, blankQuestion()]);
    setActiveIdx(questions.length);
  };

  const deleteActive = () => {
    const next = questions.filter((_, i) => i !== activeIdx);
    setQuestions(next);
    setActiveIdx(Math.max(0, Math.min(activeIdx, next.length - 1)));
  };

  const goToPublish = () => {
    const problem = validateQuestions(questions);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep(4);
  };

  // --- Step 4 (save + publish) ---

  const handlePublish = async () => {
    const problem = validateDetails() || validateQuestions(questions);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");

    // 1. Save the quiz. The backend always creates it as a draft.
    let quiz;
    try {
      quiz = await createQuiz({
        title: title.trim(),
        class_course: classId,
        duration_minutes: 30,
        passing_score: 60,
        difficulty: "mixed",
        source_filename: file?.name ?? "",
        questions: questions.map((q) => ({
          question_text: q.text.trim(),
          explanation: q.explanation ?? "",
          points: 1,
          choices: q.options.map((opt, i) => ({
            choice_text: opt.trim(),
            is_correct: i === q.correct,
          })),
        })),
      }).unwrap();
    } catch (err) {
      console.error("Create quiz error:", err);
      setError(extractErrorMessage(err) || "Could not save the quiz.");
      return;
    }

    // 2. Publish it so students can see it
    try {
      await publishQuiz(quiz.id).unwrap();
      onCreated?.();
      onClose();
    } catch (err) {
      console.error("Publish quiz error:", err);
      onCreated?.();
      setError(
        `Quiz saved as a draft, but publishing failed: ${
          extractErrorMessage(err) || "unknown error"
        }`
      );
    }
  };

  // --- Render helpers ---

  const renderStepper = () => (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = step > s.id;
        const active = step === s.id;
        const Icon = done ? Check : s.icon;
        return (
          <div key={s.id} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={s.id > step || isSaving || isGenerating}
              onClick={() => setStep(s.id)}
              className="flex items-center gap-2 disabled:cursor-default"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-transform hover:scale-105"
                style={{
                  ...pill(active),
                  background: active ? T.gradient : done ? T.mint : "#FFFFFF",
                  color: active ? "#FFFFFF" : done ? T.mintDeep : T.muted,
                }}
              >
                <Icon size={16} />
              </span>
              <span
                className="hidden text-sm sm:block"
                style={{
                  fontFamily: HEAD_FONT,
                  fontWeight: 700,
                  color: active ? T.pinkDeep : done ? T.mintDeep : T.muted,
                }}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className="h-1.5 flex-1 rounded-full"
                style={{ background: done ? T.mint : T.border }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Step 1: choose type + basic details
  const renderStep1 = () => {
    const cards = [
      {
        key: "ai",
        icon: Wand2,
        title: "AI from a PDF",
        desc: "Upload study notes and let AI draft the questions for you.",
        tint: "linear-gradient(135deg, #FFE0F0, #FFD1E8)",
        iconColor: T.pinkDeep,
      },
      {
        key: "manual",
        icon: PenLine,
        title: "Write it myself",
        desc: "Build each question by hand with a simple, friendly editor.",
        tint: "linear-gradient(135deg, #EDE6FF, #DCCFFF)",
        iconColor: "#7C5CD6",
      },
    ];

    return (
      <div className="space-y-6" style={{ animation: "pookie-pop .3s ease-out" }}>
        <div>
          <p className="mb-3 text-sm" style={{ color: T.muted, fontFamily: BODY_FONT, fontWeight: 700 }}>
            How would you like to build it?
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cards.map((card) => {
              const selected = creationType === card.key;
              const Icon = card.icon;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setCreationType(card.key)}
                  className="group relative flex flex-col items-start rounded-3xl p-5 text-left transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: card.tint,
                    border: `3px solid ${selected ? T.pinkDeep : "transparent"}`,
                    boxShadow: selected ? T.glow : "0 6px 16px -10px rgba(75,42,79,.25)",
                  }}
                >
                  {selected && (
                    <span
                      className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-white"
                      style={{ background: T.pinkDeep }}
                    >
                      <Check size={16} />
                    </span>
                  )}
                  <span
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white"
                    style={{ color: card.iconColor, boxShadow: "0 6px 14px -8px rgba(75,42,79,.35)" }}
                  >
                    <Icon size={26} />
                  </span>
                  <h3 className="text-lg" style={{ fontFamily: HEAD_FONT, fontWeight: 800, color: T.ink }}>
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: T.muted, fontFamily: BODY_FONT, fontWeight: 600 }}>
                    {card.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-3xl p-5 sm:grid-cols-2" style={{ background: T.surface, border: `2px dashed ${T.border}` }}>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider" style={{ color: T.muted, fontFamily: BODY_FONT, fontWeight: 800 }}>
              Class
            </span>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4"
              style={{ ...fieldStyle, fontWeight: 700 }}
            >
              <option value="">
                {classesError ? "Could not load classes" : classOptions.length ? "Select a class…" : "No classes found"}
              </option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {classShortLabel(c)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider" style={{ color: T.muted, fontFamily: BODY_FONT, fontWeight: 800 }}>
              Quiz title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 1 Midterm Review"
              className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-4"
              style={{ ...fieldStyle, fontWeight: 700 }}
            />
          </label>
        </div>
      </div>
    );
  };

  // Step 2: upload PDF, choose size, generate
  const renderStep2 = () => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-12" style={{ animation: "pookie-pop .3s ease-out" }}>
      <div className="md:col-span-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => acceptFile(e.target.files?.[0])}
        />

        {file ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl p-6 text-center" style={{ background: "#EAFBF4", border: `2px solid ${T.mint}` }}>
            <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white" style={{ color: T.mintDeep, animation: "pookie-float 3s ease-in-out infinite" }}>
              <FileText size={38} />
            </span>
            <p className="max-w-full break-all text-base" style={{ color: T.ink, fontFamily: HEAD_FONT, fontWeight: 800 }}>
              {file.name}
            </p>
            <p className="mt-1 text-xs" style={{ color: T.mintDeep, fontWeight: 800 }}>
              {Math.max(1, Math.round(file.size / 1024))} KB · ready
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-white px-4 py-1.5 text-xs transition hover:scale-105"
                style={{ color: T.ink, fontWeight: 800, boxShadow: "0 4px 10px -6px rgba(75,42,79,.4)" }}
              >
                Replace
              </button>
              <button
                type="button"
                onClick={clearFile}
                className="rounded-full px-4 py-1.5 text-xs transition hover:scale-105"
                style={{ background: "#FFE4EC", color: "#C2185B", fontWeight: 800 }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className="flex h-full min-h-[260px] w-full flex-col items-center justify-center rounded-3xl p-6 text-center transition-all"
            style={{
              background: dragging ? "#FFE0F0" : T.surface,
              border: `3px dashed ${dragging ? T.pinkDeep : "#E9B8D6"}`,
              transform: dragging ? "scale(1.02)" : "none",
            }}
          >
            <span
              className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl text-white"
              style={{ background: T.gradient, boxShadow: T.glow, animation: "pookie-float 3s ease-in-out infinite" }}
            >
              <UploadCloud size={36} />
            </span>
            <p className="text-lg" style={{ color: T.ink, fontFamily: HEAD_FONT, fontWeight: 800 }}>
              Drop your PDF here
            </p>
            <p className="mt-1 text-sm" style={{ color: T.muted, fontWeight: 700 }}>
              or click to browse · text-based PDFs work best
            </p>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 md:col-span-6">
        <div className="rounded-3xl bg-white p-5" style={{ border: `2px solid ${T.border}` }}>
          <p className="text-sm" style={{ color: T.ink, fontFamily: HEAD_FONT, fontWeight: 800 }}>
            How many questions?
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQuestionCount(n)}
                className="rounded-2xl py-3 text-lg transition hover:scale-105"
                style={{ ...pill(questionCount === n), fontFamily: HEAD_FONT, fontWeight: 800 }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 rounded-3xl bg-white p-5" style={{ border: `2px solid ${T.border}`, minHeight: 200 }}>
          {isGenerating ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                style={{ background: T.gradient, animation: "pookie-wiggle 1.2s ease-in-out infinite" }}
              >
                <Sparkles size={26} />
              </span>
              <p style={{ color: T.ink, fontFamily: HEAD_FONT, fontWeight: 800 }}>
                {GENERATING_MESSAGES[msgIdx]}
              </p>
              <div className="mt-4 w-full space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-3 rounded-full"
                    style={{
                      width: `${90 - i * 12}%`,
                      margin: "0 auto",
                      background: "linear-gradient(90deg, #FDE7F3 25%, #FFFFFF 50%, #FDE7F3 75%)",
                      backgroundSize: "200% 100%",
                      animation: "pookie-shimmer 1.4s linear infinite",
                    }}
                  />
                ))}
              </div>
            </div>
          ) : questions.length > 0 ? (
            <div className="flex h-full flex-col">
              <p className="mb-3 text-sm" style={{ color: "#1FA47A", fontFamily: HEAD_FONT, fontWeight: 800 }}>
                ✨ {questions.length} questions ready for review
              </p>
              <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div key={idx} className="rounded-2xl p-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <span className="text-[11px] uppercase tracking-wider" style={{ color: T.pinkDeep, fontWeight: 800 }}>
                      Question {idx + 1}
                    </span>
                    <p className="mt-0.5 text-sm" style={{ color: T.ink, fontWeight: 700 }}>
                      {q.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="mb-2 text-4xl" style={{ animation: "pookie-float 3s ease-in-out infinite" }}>🪄</span>
              <p className="text-sm" style={{ color: T.muted, fontWeight: 700 }}>
                Pick a count and hit <b style={{ color: T.pinkDeep }}>Generate</b> to create your questions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 3: edit questions (AI results or manual)
  const renderStep3 = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12" style={{ animation: "pookie-pop .3s ease-out" }}>
      <div className="flex flex-col rounded-3xl bg-white p-4 md:col-span-4" style={{ border: `2px solid ${T.border}`, minHeight: 380 }}>
        <div className="mb-3 flex items-center justify-between">
          <h4 style={{ color: T.ink, fontFamily: HEAD_FONT, fontWeight: 800 }}>Questions</h4>
          <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: T.lilac, color: "#4B2A8A", fontWeight: 800 }}>
            {questions.length}
          </span>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {questions.map((q, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className="w-full rounded-2xl p-3 text-left transition hover:-translate-y-0.5"
              style={{
                background: activeIdx === idx ? "#FFE0F0" : T.surface,
                border: `2px solid ${activeIdx === idx ? T.pink : "transparent"}`,
              }}
            >
              <span className="text-[11px] uppercase tracking-wider" style={{ color: T.pinkDeep, fontWeight: 800 }}>
                Q{idx + 1}
              </span>
              <p className="line-clamp-2 text-sm" style={{ color: T.ink, fontWeight: 700 }}>
                {q.text || "New question"}
              </p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={addQuestion}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm transition hover:scale-[1.02]"
          style={{ ...pill(false), color: T.pinkDeep, fontWeight: 800 }}
        >
          <Plus size={16} /> Add question
        </button>
      </div>

      <div className="rounded-3xl bg-white p-5 md:col-span-8" style={{ border: `2px solid ${T.border}`, minHeight: 380 }}>
        {activeQuestion ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 style={{ color: T.ink, fontFamily: HEAD_FONT, fontWeight: 800 }}>
                Question {activeIdx + 1}
              </h4>
              <button
                type="button"
                onClick={deleteActive}
                className="flex items-center gap-1 rounded-full px-3 py-1 text-xs transition hover:scale-105"
                style={{ background: "#FFE4EC", color: "#C2185B", fontWeight: 800 }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>

            <textarea
              value={activeQuestion.text}
              onChange={(e) => patchActive({ text: e.target.value })}
              placeholder="What would you like to ask?"
              className="h-20 w-full resize-none rounded-2xl p-3 text-sm outline-none focus:ring-4"
              style={{ ...fieldStyle, fontWeight: 700 }}
            />

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider" style={{ color: T.muted, fontWeight: 800 }}>
                Options · tap a letter to mark the correct answer
              </p>
              {LETTERS.map((letter, idx) => {
                const isCorrect = activeQuestion.correct === idx;
                return (
                  <div
                    key={letter}
                    className="flex items-center gap-3 rounded-2xl p-1.5 transition"
                    style={{ background: isCorrect ? "#EAFBF4" : "transparent" }}
                  >
                    <button
                      type="button"
                      onClick={() => patchActive({ correct: idx })}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition hover:scale-110"
                      style={{
                        background: isCorrect ? T.mint : "#FFFFFF",
                        color: isCorrect ? T.mintDeep : T.muted,
                        border: `2px solid ${isCorrect ? T.mintDeep : T.border}`,
                        fontFamily: HEAD_FONT,
                        fontWeight: 800,
                      }}
                    >
                      {isCorrect ? <Check size={16} /> : letter}
                    </button>
                    <input
                      value={activeQuestion.options[idx] ?? ""}
                      onChange={(e) => patchOption(idx, e.target.value)}
                      placeholder={`Option ${letter}`}
                      className="flex-1 rounded-xl px-3 py-2 text-sm outline-none focus:ring-4"
                      style={{ ...fieldStyle, fontWeight: 700, background: "#FFFFFF" }}
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wider" style={{ color: T.muted, fontWeight: 800 }}>
                Explanation (optional)
              </p>
              <textarea
                value={activeQuestion.explanation}
                onChange={(e) => patchActive({ explanation: e.target.value })}
                placeholder="Why is the correct answer correct?"
                className="h-16 w-full resize-none rounded-2xl p-3 text-sm outline-none focus:ring-4"
                style={{ ...fieldStyle, fontWeight: 700 }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
            <span className="mb-2 text-4xl">🌸</span>
            <p className="text-sm" style={{ color: T.muted, fontWeight: 700 }}>
              Add a question to start editing.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Step 4: confirm and publish
  const renderStep4 = () => {
    const stats = [
      { label: "Questions", value: questions.length, bg: "#FFE0F0", color: T.pinkDeep },
      { label: "Options each", value: 4, bg: "#EDE6FF", color: "#7C5CD6" },
      { label: "Time limit", value: "30 min", bg: "#EAFBF4", color: T.mintDeep },
    ];
    return (
      <div className="flex flex-col items-center gap-6 text-center" style={{ animation: "pookie-pop .3s ease-out" }}>
        <span
          className="flex h-24 w-24 items-center justify-center rounded-full text-white"
          style={{ background: T.gradient, boxShadow: T.glow, animation: "pookie-float 3s ease-in-out infinite" }}
        >
          <CheckCircle2 size={48} />
        </span>
        <div>
          <h3 className="text-3xl" style={{ color: T.ink, fontFamily: HEAD_FONT, fontWeight: 800 }}>
            Ready to publish! 🎉
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: T.muted, fontWeight: 700 }}>
            <b style={{ color: T.ink }}>{title}</b>
            {selectedClass ? (
              <>
                {" "}for <b style={{ color: T.ink }}>{classShortLabel(selectedClass)}</b>
              </>
            ) : null}
            . Students will see it once you publish.
          </p>
        </div>
        <div className="grid w-full max-w-lg grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl p-4" style={{ background: s.bg }}>
              <p className="text-2xl" style={{ color: s.color, fontFamily: HEAD_FONT, fontWeight: 800 }}>
                {s.value}
              </p>
              <p className="text-xs" style={{ color: s.color, fontWeight: 800 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- Main render ---

  if (!open) return null;

  const primaryBtn = (disabled) => ({
    background: disabled ? "#EADDF0" : T.gradient,
    color: disabled ? "#B9A3C2" : "#FFFFFF",
    boxShadow: disabled ? "none" : T.glow,
    fontFamily: HEAD_FONT,
    fontWeight: 800,
  });

  const secondaryBtn = {
    background: "#FFFFFF",
    color: T.ink,
    border: `2px solid ${T.border}`,
    fontFamily: HEAD_FONT,
    fontWeight: 800,
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(75, 42, 79, 0.35)", backdropFilter: "blur(6px)", fontFamily: BODY_FONT }}
    >
      <style>{KEYFRAMES}</style>

      <div
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-[28px]"
        style={{
          background: T.card,
          height: "min(90vh, 780px)",
          boxShadow: "0 30px 80px -20px rgba(75, 42, 79, 0.45)",
          animation: "pookie-pop .35s ease-out",
        }}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden px-6 pb-4 pt-5" style={{ background: "linear-gradient(120deg, #FFE0F0 0%, #EDE6FF 100%)" }}>
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-60" style={{ background: "radial-gradient(circle, #FFFFFF, transparent 70%)" }} />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full opacity-50" style={{ background: "radial-gradient(circle, #FFFFFF, transparent 70%)" }} />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: T.pinkDeep, fontWeight: 800 }}>
                Quiz studio
              </p>
              <h2 className="text-2xl sm:text-3xl" style={{ color: T.ink, fontFamily: HEAD_FONT, fontWeight: 800 }}>
                Create a new quiz <span className="inline-block" style={{ animation: "pookie-wiggle 2.5s ease-in-out infinite" }}>✨</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white p-2 transition hover:rotate-90"
              style={{ color: T.ink, boxShadow: "0 4px 10px -6px rgba(75,42,79,.4)" }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative mt-5">{renderStepper()}</div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm" style={{ background: "#FFE4EC", color: "#B0135A", border: "2px solid #FFB3D1", fontWeight: 800 }}>
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t px-6 py-4" style={{ borderColor: T.border, background: T.surface }}>
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            disabled={isSaving || isGenerating}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition hover:scale-105 disabled:opacity-50"
            style={secondaryBtn}
          >
            {step > 1 && <ArrowLeft size={16} />}
            {step === 1 ? "Cancel" : "Back"}
          </button>

          <div className="flex gap-3">
            {step === 1 && (
              <button
                type="button"
                onClick={goNextFromStep1}
                disabled={!creationType || !classId || !title.trim()}
                className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={primaryBtn(!creationType || !classId || !title.trim())}
              >
                Continue <ArrowRight size={16} />
              </button>
            )}

            {step === 2 && questions.length === 0 && (
              <button
                type="button"
                onClick={runAiGeneration}
                disabled={isGenerating || !file}
                className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={primaryBtn(isGenerating || !file)}
              >
                <Sparkles size={16} /> {isGenerating ? "Generating…" : "Generate questions"}
              </button>
            )}

            {step === 2 && questions.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={runAiGeneration}
                  disabled={isGenerating || !file}
                  className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition hover:scale-105 disabled:opacity-50"
                  style={secondaryBtn}
                >
                  <RefreshCw size={15} /> Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={isGenerating}
                  className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm transition hover:scale-105"
                  style={primaryBtn(false)}
                >
                  Review questions <ArrowRight size={16} />
                </button>
              </>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={goToPublish}
                disabled={questions.length === 0}
                className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={primaryBtn(questions.length === 0)}
              >
                Looks good <ArrowRight size={16} />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm transition hover:scale-105 disabled:opacity-60"
                style={{ ...primaryBtn(isSaving), background: isSaving ? "#EADDF0" : `linear-gradient(135deg, ${T.mint}, #7FE0BF)`, color: isSaving ? "#B9A3C2" : T.ink }}
              >
                <Send size={16} /> {isSaving ? "Publishing…" : "Publish quiz"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}