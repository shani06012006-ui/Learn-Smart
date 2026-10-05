import Modal from "./Modal";
import Button from "./Button";

/**
 * ConfirmDialog -- small confirmation modal.
 *
 * Reuses <Modal> so styling is consistent with the rest of the app.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        {description || "This action cannot be undone."}
      </p>
    </Modal>
  );
}
