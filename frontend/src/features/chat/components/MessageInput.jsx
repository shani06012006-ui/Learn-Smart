import { useState } from "react";
import { Send } from "lucide-react";

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await onSend(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 bg-white p-3"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Type a message..."
        className="focus-ring min-h-[40px] max-h-40 flex-1 resize-none rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500"
        style={{ height: "40px" }}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Send message"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
