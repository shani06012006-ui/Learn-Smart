import { useState } from "react";

import { useCreateAnnouncementMutation } from "../../../../store/api/materialsApi";
import { extractErrorMessage, extractFieldErrors } from "../../../../utils/apiError";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

export default function CreateAnnouncementModal({ open, onClose, classId }) {
  const [createAnnouncement, { isLoading }] = useCreateAnnouncementMutation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const reset = () => {
    setTitle("");
    setBody("");
    setIsPinned(false);
    setFieldErrors({});
    setFormError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    try {
      await createAnnouncement({
        classId,
        title,
        body,
        is_pinned: isPinned,
      }).unwrap();
      reset();
      onClose();
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      setFormError(extractErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Post announcement">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
          placeholder="e.g. Quiz on Friday"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="announcement-body" className="text-sm font-medium text-ink-700">
            Message
          </label>
          <textarea
            id="announcement-body"
            rows={5}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900"
            placeholder="Details for your students..."
          />
          {fieldErrors.body && (
            <p className="text-sm text-danger-700">{fieldErrors.body}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="focus-ring h-4 w-4 rounded border-ink-300 text-brand-600"
          />
          Pin to top of the class notice board
        </label>

        {formError && !Object.keys(fieldErrors).length && (
          <p role="alert" className="text-sm text-danger-700">
            {formError}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={!title.trim() || !body.trim()}
          >
            Post announcement
          </Button>
        </div>
      </form>
    </Modal>
  );
}
