import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import {
  useAddQuestionMutation,
  useUpdateQuestionMutation,
} from "../../../../store/api/examsApi";
import { extractErrorMessage, extractFieldErrors } from "../../../../utils/apiError";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

const blankChoice = () => ({ text: "", is_correct: false });

const initialForm = () => ({
  text: "",
  marks: 1,
  choices: [blankChoice(), blankChoice(), blankChoice(), blankChoice()],
});

export default function QuestionFormModal({ open, onClose, quizId, question }) {
  const isEdit = !!question;

  const [addQuestion, { isLoading: isAdding }] = useAddQuestionMutation();
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateQuestionMutation();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (question) {
      setForm({
        text: question.text,
        marks: question.marks,
        choices: question.choices.map((c) => ({
          text: c.text,
          is_correct: !!c.is_correct,
        })),
      });
    } else {
      setForm(initialForm());
    }
    setFieldErrors({});
    setFormError(null);
  }, [open, question]);

  const handleClose = () => {
    setFieldErrors({});
    setFormError(null);
    onClose();
  };

  const setChoiceText = (idx, text) => {
    setForm((f) => {
      const next = [...f.choices];
      next[idx] = { ...next[idx], text };
      return { ...f, choices: next };
    });
  };

  const markCorrect = (idx) => {
    setForm((f) => ({
      ...f,
      choices: f.choices.map((c, i) => ({ ...c, is_correct: i === idx })),
    }));
  };

  const addChoice = () => {
    setForm((f) => ({ ...f, choices: [...f.choices, blankChoice()] }));
  };

  const removeChoice = (idx) => {
    setForm((f) => {
      if (f.choices.length <= 2) return f;
      const next = f.choices.filter((_, i) => i !== idx);
      return { ...f, choices: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const payload = {
      text: form.text,
      marks: Number(form.marks),
      choices: form.choices
        .map((c) => ({ text: c.text.trim(), is_correct: !!c.is_correct }))
        .filter((c) => c.text.length > 0),
    };

    try {
      if (isEdit) {
        await updateQuestion({
          questionId: question.id,
          quiz_id: quizId,
          ...payload,
        }).unwrap();
      } else {
        await addQuestion({ quizId, ...payload }).unwrap();
      }
      onClose();
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      setFormError(extractErrorMessage(err));
    }
  };

  const correctCount = form.choices.filter((c) => c.is_correct).length;
  const busy = isAdding || isUpdating;
  const canSubmit =
    form.text.trim().length > 0 &&
    form.choices.filter((c) => c.text.trim().length > 0).length >= 2 &&
    correctCount === 1;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit question" : "Add question"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q-text" className="text-sm font-medium text-ink-700">
            Question text
          </label>
          <textarea
            id="q-text"
            rows={3}
            required
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            className="focus-ring rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900"
            placeholder="e.g. What is the SI unit of acceleration?"
          />
          {fieldErrors.text && (
            <p className="text-sm text-danger-700">{fieldErrors.text}</p>
          )}
        </div>

        <Input
          label="Marks"
          type="number"
          min={1}
          required
          value={form.marks}
          onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
          error={fieldErrors.marks}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink-700">
              Choices <span className="font-normal text-ink-500">(pick exactly one correct)</span>
            </label>
            <button
              type="button"
              onClick={addChoice}
              className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
            >
              <Plus size={12} />
              Add choice
            </button>
          </div>

          {form.choices.map((choice, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-choice"
                checked={choice.is_correct}
                onChange={() => markCorrect(idx)}
                className="focus-ring h-4 w-4 text-brand-600"
                aria-label={`Mark choice ${idx + 1} as correct`}
              />
              <input
                type="text"
                value={choice.text}
                onChange={(e) => setChoiceText(idx, e.target.value)}
                placeholder={`Choice ${idx + 1}`}
                className="focus-ring flex-1 rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900"
              />
              <button
                type="button"
                onClick={() => removeChoice(idx)}
                disabled={form.choices.length <= 2}
                className="focus-ring rounded-md p-1.5 text-ink-500 hover:bg-danger-50 hover:text-danger-700 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Remove choice ${idx + 1}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {correctCount !== 1 && (
            <p className="text-sm text-danger-700">
              Exactly one choice must be marked correct.
            </p>
          )}
          {fieldErrors.choices && (
            <p className="text-sm text-danger-700">{fieldErrors.choices}</p>
          )}
        </div>

        {formError && !Object.keys(fieldErrors).length && (
          <p role="alert" className="text-sm text-danger-700">
            {formError}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy} disabled={!canSubmit}>
            {isEdit ? "Save changes" : "Add question"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
