import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { useUploadMaterialMutation } from "../../../../store/api/materialsApi";
import { extractErrorMessage, extractFieldErrors } from "../../../../utils/apiError";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

export default function UploadMaterialModal({ open, onClose, classId }) {
  const [uploadMaterial, { isLoading }] = useUploadMaterialMutation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const fileInputRef = useRef(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setFieldErrors({});
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    if (!file) {
      setFieldErrors({ file: "Pick a file to upload." });
      return;
    }

    // NOTE: in mock mode the local dispatcher expects a plain object with
    // file metadata, not a FormData instance. When the real Django backend
    // lands, this reverts to:
    //
    //   const formData = new FormData();
    //   formData.append("title", title);
    //   formData.append("description", description);
    //   formData.append("file", file);
    //   await uploadMaterial({ classId, formData }).unwrap();
    //
    // Django's FileField expects multipart, so the shape change is
    // temporary and isolated to this one call site.
    try {
      await uploadMaterial({
        classId,
        title,
        description,
        file: { name: file.name, size: file.size, type: file.type },
      }).unwrap();
      reset();
      onClose();
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      setFormError(extractErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Upload material">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
          placeholder="e.g. Chapter 4 — Newton's Laws"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="material-description" className="text-sm font-medium text-ink-700">
            Description <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <textarea
            id="material-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="focus-ring rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="material-file" className="text-sm font-medium text-ink-700">
            File
          </label>
          <label
            htmlFor="material-file"
            className="focus-ring flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink-300 bg-ink-100/50 px-4 py-4 text-sm text-ink-700 hover:bg-ink-100"
          >
            <UploadCloud size={20} className="text-ink-500" />
            <span className="flex-1 truncate">
              {file ? file.name : "Choose a file (PDF, image, or notes)"}
            </span>
          </label>
          <input
            ref={fileInputRef}
            id="material-file"
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {fieldErrors.file && (
            <p className="text-sm text-danger-700">{fieldErrors.file}</p>
          )}
          <p className="text-xs text-ink-500">Maximum size: 10 MB.</p>
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
          <Button type="submit" loading={isLoading} disabled={!file || !title.trim()}>
            Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
}
