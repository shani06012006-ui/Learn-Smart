import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";

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

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            className="focus-ring rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500"
            placeholder="What does this material cover?"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="material-file" className="text-sm font-medium text-ink-700">
            File
          </label>

          {file ? (
            <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50/50 px-4 py-3 text-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-brand-600">
                <UploadCloud size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">{file.name}</p>
                <p className="text-xs text-ink-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearFile}
                className="focus-ring shrink-0 rounded-md p-1 text-ink-500 hover:bg-white hover:text-danger-700"
                aria-label="Remove selected file"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label
              htmlFor="material-file"
              className="focus-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 bg-ink-100/40 px-4 py-6 text-sm text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <UploadCloud size={22} className="text-ink-500" />
              <span className="font-medium text-ink-900">
                Choose a file to upload
              </span>
              <span className="text-xs text-ink-500">
                PDF, image, or notes — up to 10 MB
              </span>
            </label>
          )}

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
        </div>

        {formError && !Object.keys(fieldErrors).length && (
          <p
            role="alert"
            className="rounded-lg border border-danger-50 bg-danger-50/60 px-3 py-2 text-sm text-danger-700"
          >
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
