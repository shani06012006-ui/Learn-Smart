import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Plus } from "lucide-react";

import { useGetQuizDetailQuery } from "../../../store/api/examsApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import QuizHeaderCard from "./components/QuizHeaderCard";
import QuestionList from "./components/QuestionList";
import QuestionFormModal from "./components/QuestionFormModal";
import QuestionPaperPreview from "./components/QuestionPaperPreview";

export default function QuizBuilderPage() {
  const { classId, quizId } = useParams();
  const { data: quiz, isLoading, isError, error, refetch } =
    useGetQuizDetailQuery(quizId);

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionModalOpen(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionModalOpen(true);
  };

  const handleCloseQuestionModal = () => {
    setQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  if (isLoading) return <LoadingState label="Loading quiz..." />;
  if (isError) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />;
  }

  const questions = quiz.questions || [];

  return (
    <div>
      <Link
        to={`/teacher/classes/${classId}`}
        className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700"
      >
        <ArrowLeft size={16} />
        Back to class
      </Link>

      <QuizHeaderCard quiz={quiz} classId={classId} />

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Questions</h2>
            <p className="text-xs text-ink-500">
              {questions.length === 0
                ? "No questions yet."
                : `${questions.length} ${questions.length === 1 ? "question" : "questions"} · ${quiz.total_marks} marks total`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setPreviewOpen(true)}
              disabled={questions.length === 0}
            >
              <Eye size={16} />
              Preview
            </Button>
            <Button onClick={handleAddQuestion}>
              <Plus size={16} />
              Add question
            </Button>
          </div>
        </div>

        <QuestionList
          questions={questions}
          quizId={quizId}
          onEdit={handleEditQuestion}
          onEmptyAdd={handleAddQuestion}
        />
      </section>

      <QuestionFormModal
        open={questionModalOpen}
        onClose={handleCloseQuestionModal}
        quizId={quizId}
        question={editingQuestion}
      />

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Question paper preview"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>Print</Button>
          </>
        }
      >
        <QuestionPaperPreview quiz={quiz} />
      </Modal>
    </div>
  );
}
