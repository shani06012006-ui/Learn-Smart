import { Trash2, RefreshCw, CheckCircle2 } from "lucide-react";

export default function ReviewQuestionCard({
  index,
  question,
  onChange,
  onDelete,
  onRegenerate,
  regenerating,
}) {
  const setField = (patch) => onChange({ ...question, ...patch });

  const setChoice = (cIdx, patch) => {
    const next = question.choices.map((c, i) =>
      i === cIdx ? { ...c, ...patch } : c
    );
    onChange({ ...question, choices: next });
  };

  const setCorrect = (cIdx) => {
    const next = question.choices.map((c, i) => ({
      ...c,
      is_correct: i === cIdx,
    }));
    onChange({ ...question, choices: next });
  };

  const letters = ["A", "B", "C", "D"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-600">
          Q{index + 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
            Regenerate
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Question
        </span>
        <textarea
          value={question.question_text}
          onChange={(e) => setField({ question_text: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
        />
      </label>

      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Choices · click the circle to mark the correct answer
        </p>
        <div className="grid grid-cols-1 gap-2">
          {question.choices.map((choice, cIdx) => (
            <div
              key={cIdx}
              className={
                "flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2 transition " +
                (choice.is_correct
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200")
              }
            >
              <button
                type="button"
                onClick={() => setCorrect(cIdx)}
                className={
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition " +
                  (choice.is_correct
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 text-transparent hover:border-purple-400")
                }
                title="Mark as correct"
              >
                <CheckCircle2 size={14} />
              </button>
              <span className="w-5 text-center text-[11px] font-bold text-slate-400">
                {letters[cIdx]}
              </span>
              <input
                type="text"
                value={choice.choice_text}
                onChange={(e) =>
                  setChoice(cIdx, { choice_text: e.target.value })
                }
                className="flex-1 border-0 bg-transparent text-sm focus:outline-none"
                placeholder={`Option ${letters[cIdx]}`}
              />
            </div>
          ))}
        </div>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Explanation (optional)
        </span>
        <textarea
          value={question.explanation || ""}
          onChange={(e) => setField({ explanation: e.target.value })}
          rows={2}
          placeholder="Why the correct answer is correct…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
        />
      </label>
    </div>
  );
}