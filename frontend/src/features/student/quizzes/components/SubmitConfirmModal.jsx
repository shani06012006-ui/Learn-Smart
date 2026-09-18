import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";

export default function SubmitConfirmModal({
  open,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  isSubmitting,
}) {
  const unanswered = totalQuestions - answeredCount;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit this quiz?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Keep working
          </Button>
          <Button onClick={onConfirm} loading={isSubmitting}>
            Submit quiz
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-700">
        You&apos;ve answered <span className="font-medium">{answeredCount}</span> of{" "}
        <span className="font-medium">{totalQuestions}</span> questions.
      </p>
      {unanswered > 0 && (
        <p className="mt-2 text-sm text-warning-700">
          {unanswered} {unanswered === 1 ? "question is" : "questions are"} still
          unanswered and will be marked incorrect.
        </p>
      )}
      <p className="mt-3 text-xs text-ink-500">
        Once you submit, you can&apos;t change your answers. You&apos;ll see your
        score and the correct answers on the next screen.
      </p>
    </Modal>
  );
}
