import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, FileText, Trash2, Check, X } from "lucide-react";

import {
  useDeleteQuizMutation,
  useUpdateQuizMutation,
} from "../../../../store/api/examsApi";
import Button from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";
import Badge from "../../../../components/ui/Badge";

export default function QuizHeaderCard({ quiz, classId }) {
  const navigate = useNavigate();
  const [updateQuiz, { isLoading: isUpdating }] = useUpdateQuizMutation();
  const [deleteQuiz, { isLoading: isDeleting }] = useDeleteQuizMutation();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleTogglePublish = async () => {
    await updateQuiz({
      quizId: quiz.id,
      classId,
      is_published: !quiz.is_published,
    }).unwrap();
  };

  const handleDelete = async () => {
    await deleteQuiz({ quizId: quiz.id, classId }).unwrap();
    navigate(`/teacher/classes/${classId}`);
  };

  return (
    <>
      <div className="rounded-xl border border-ink-300 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              {quiz.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="neutral">Draft</Badge>
              )}
            </div>
            <h1 className="text-xl font-semibold text-ink-900">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-1 max-w-xl text-sm text-ink-500">{quiz.description}</p>
            )}
            <div className="mt-2 flex items-center gap-3 text-sm text-ink-500">
              <span className="flex items-center gap-1.5">
                <FileText size={14} />
                {quiz.question_count} {quiz.question_count === 1 ? "question" : "questions"}
              </span>
              <span>{quiz.total_marks} marks</span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {quiz.duration_minutes} min
              </span>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 size={16} />
              Delete
            </Button>
            <Button
              variant={quiz.is_published ? "secondary" : "primary"}
              loading={isUpdating}
              onClick={handleTogglePublish}
              disabled={quiz.question_count === 0}
              title={
                quiz.question_count === 0
                  ? "Add at least one question before publishing"
                  : undefined
              }
            >
              {quiz.is_published ? (
                <>
                  <X size={16} />
                  Unpublish
                </>
              ) : (
                <>
                  <Check size={16} />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete this quiz?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
              Delete quiz
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700">
          <span className="font-medium">{quiz.title}</span> will be removed. Any
          student submissions stay on record but the quiz won&apos;t be visible to
          students.
        </p>
      </Modal>
    </>
  );
}
