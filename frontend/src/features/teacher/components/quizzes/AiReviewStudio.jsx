import { Plus, Save, Send, Archive } from "lucide-react";
import Button from "../../../../components/ui/Button";
import ReviewQuestionCard from "./ReviewQuestionCard";

const EMPTY_QUESTION = () => ({
  question_text: "",
  explanation: "",
  points: 1,
  choices: [
    { choice_text: "", is_correct: true },
    { choice_text: "", is_correct: false },
    { choice_text: "", is_correct: false },
    { choice_text: "", is_correct: false },
  ],
});

export default function AiReviewStudio({
  title,
  questions,
  onQuestionsChange,
  onSaveDraft,
  onPublish,
  onUnpublish,
  saving,
  publishing,
  saveLabel,
  publishLabel,
  onRegenerateQuestion,
  regeneratingIndex,
}) {
  const update = (idx, q) => {
    const next = [...questions];
    next[idx] = q;
    onQuestionsChange(next);
  };

  const remove = (idx) => {
    onQuestionsChange(questions.filter((_, i) => i !== idx));
  };

  const addCustom = () => {
    onQuestionsChange([...questions, EMPTY_QUESTION()]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-extrabold text-navy-950">
            Review & Edit
          </h3>
          <p className="text-xs text-slate-500">
            {questions.length} question{questions.length === 1 ? "" : "s"} ·{" "}
            {title}
          </p>
        </div>
        <button
          type="button"
          onClick={addCustom}
          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-600 hover:bg-purple-100"
        >
          <Plus size={13} /> Add custom question
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <ReviewQuestionCard
            key={i}
            index={i}
            question={q}
            onChange={(next) => update(i, next)}
            onDelete={() => remove(i)}
            onRegenerate={() => onRegenerateQuestion?.(i)}
            regenerating={regeneratingIndex === i}
          />
        ))}
        {questions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-navy-950">
              No questions yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Click "Add custom question" to start writing.
            </p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:-mx-6 sm:px-6">
        <div>
          {onUnpublish && (
            <button
              type="button"
              onClick={onUnpublish}
              disabled={saving || publishing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-100 disabled:opacity-50"
            >
              <Archive size={13} />
              Unpublish (Set to Draft)
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={onSaveDraft} disabled={saving || publishing}>
            <Save size={14} />
            {saving ? "Saving…" : (saveLabel || "Save as Draft")}
          </Button>
          <Button
            variant="primary"
            onClick={onPublish}
            disabled={publishing || saving || questions.length === 0}
          >
            <Send size={14} />
            {publishing ? "Saving…" : (publishLabel || "Publish to Students")}
          </Button>
        </div>
      </div>
    </div>
  );
}