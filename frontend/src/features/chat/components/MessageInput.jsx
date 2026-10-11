import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

const MIN_HEIGHT = 40;
const MAX_HEIGHT = 160;

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = `${MIN_HEIGHT}px`;
    }
    await onSend(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const buttonDisabled = disabled || !text.trim();

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-white p-3">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Type a message..."
        className="focus-ring flex-1 resize-none overflow-y-auto rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500"
        style={{ minHeight: `${MIN_HEIGHT}px`, maxHeight: `${MAX_HEIGHT}px` }}
      />
      <button
        type="submit"
        disabled={buttonDisabled}
        className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={disabled ? "Sending..." : "Send message"}
      >
        {disabled ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
      </button>
    </form>
  );
}
