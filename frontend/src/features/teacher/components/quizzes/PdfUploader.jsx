import { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

export default function PdfUploader({ file, onChange, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const pick = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      alert("Only .pdf files are accepted.");
      return;
    }
    onChange(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    pick(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-all " +
          (disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : dragOver
            ? "border-purple-400 bg-purple-50"
            : "border-slate-300 bg-white hover:border-purple-300 hover:bg-slate-50")
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          disabled={disabled}
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {file ? (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FileText size={22} />
            </span>
            <p className="text-sm font-bold text-navy-950">{file.name}</p>
            <p className="text-[11px] text-slate-500">
              {(file.size / 1024).toFixed(1)} KB · click to replace
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
            >
              <X size={12} /> Remove
            </button>
          </>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <UploadCloud size={22} />
            </span>
            <p className="text-sm font-bold text-navy-950">
              Drag & drop a PDF here
            </p>
            <p className="text-[11px] text-slate-500">
              or click to browse · text-based PDFs work best
            </p>
          </>
        )}
      </div>
    </div>
  );
}