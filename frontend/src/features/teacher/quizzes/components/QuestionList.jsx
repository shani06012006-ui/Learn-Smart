import { useState } from "react";
import { Pencil, Trash2, ClipboardList } from "lucide-react";

import { useDeleteQuestionMutation } from "../../../../store/api/examsApi";
import Button from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";
import Card from "../../../../components/ui/Card";
import EmptyState from "../../../../components/feedback/EmptyState";

export default function QuestionList({ questions, quizId, onEdit, onEmptyAdd }) {
  const [deleteQuestion, { isLoading: isDeleting }] = useDeleteQuestionMutation();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDelete = async () => {
    try {
      await deleteQuestion({ questionId: deleteTarget.id, quizId }).unwrap();
    } finally {
      setDeleteTarget(null);
    }
  };

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No questions yet"
        description="Add your first multiple-choice question to this quiz."
        action={<Button onClick={onEmptyAdd}>Add question</Button>}
      />
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-3">
        {questions.map((q, idx) => (
          <li key={q.id}>
            <Card padding="md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                    Question {idx + 1} · {q.marks}{" "}
                    {q.marks === 1 ? "mark" : "marks"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink-900">
                    {q.text}
                  </p>

                  <ul className="mt-3 flex flex-col gap-1.5">
                    {q.choices.map((c) => {
                      const correct = c.is_correct;
                      return (
                        <li
                          key={c.id}
                          className={
                            "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm " +
                            (correct
                              ? "bg-success-50 text-success-700"
                              : "bg-ink-100/60 text-ink-700")
                          }
                        >
                          <span
                            className={
                              "h-1.5 w-1.5 shrink-0 rounded-full " +
                              (correct ? "bg-success-500" : "bg-ink-300")
                            }
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">{c.text}</span>
                          {correct && (
                            <span className="shrink-0 text-xs font-medium">
                              Correct answer
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onEdit(q)}>
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteTarget(q)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this question?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
              Delete question
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700">
          Question <span className="font-medium">{deleteTarget?.text}</span> and
          its choices will be removed from this quiz.
        </p>
      </Modal>
    </>
  );
}
