import { useEffect, useRef, useState } from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { useUploadClassMaterialMutation } from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv",
  "png", "jpg", "jpeg", "gif", "webp",
  "mp4", "mov", "webm",
  "mp3", "m4a", "wav",
  "zip",
]);

const MAX_BYTES = 50 * 1024 * 1024;

function fmtSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadMaterialModal({ open, onClose, classId, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const [uploadMaterial, { isLoading }] = useUploadClassMaterialMutation();

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setFile(null);
      setError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  function handleFileChange(e) {
    setError("");
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }

    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      setError(`File type ".${ext}" is not allowed.`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`File is too large (${fmtSize(f.size)}). Maximum is 50 MB.`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(f);
    if (!title) {
      // Suggest title from filename (without extension)
      const base = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
      setTitle(base);
    }
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimTitle = title.trim();
    if (!trimTitle) {
      setError("Title is required.");
      return;
    }
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("title", trimTitle);
    formData.append("description", description.trim());
    formData.append("file", file);

    try {
      const res = await uploadMaterial({ classId, formData }).unwrap();
      onSuccess?.(res);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload material"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="upload-material-form"
            loading={isLoading}
          >
            Upload
          </Button>
        </>
      }
    >
      <form id="upload-material-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 1 - Introduction"
            autoFocus
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Description (optional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="A short note for your students"
            className="resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy-950 outline-none transition focus:border-purple-400"
          />
        </label>

        {/* File picker */}
        {!file ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition hover:border-purple-300 hover:bg-purple-50/50">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <UploadCloud size={20} />
            </span>
            <span className="text-sm font-bold text-navy-950">
              Click to choose a file
            </span>
            <span className="text-[11px] text-slate-400">
              PDF, Word, Excel, images, video, audio, zip — up to 50 MB
            </span>
          </label>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FileIcon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy-950">
                {file.name}
              </p>
              <p className="text-[11px] text-slate-400">{fmtSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-coral-600"
              title="Remove file"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
