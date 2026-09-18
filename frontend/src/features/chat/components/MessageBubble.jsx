import { useState } from "react";
import clsx from "clsx";
import { Check, CheckCheck, Trash2 } from "lucide-react";

import { avatarColor } from "../../../utils/avatarColor";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Tick states:
//   isOwn && !message.read_by_others => single gray tick (sent)
//   isOwn &&  message.read_by_others => double blue tick (read)
// Non-own messages don't render ticks.
function Ticks({ readByOthers }) {
  if (readByOthers) {
    return <CheckCheck size={12} className="text-brand-100" aria-label="Read" />;
  }
  return <Check size={12} className="text-brand-100" aria-label="Sent" />;
}

export default function MessageBubble({ message, isOwn, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const avatar = avatarColor(message.sender_id);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete?.(message);
    } else {
      setConfirmDelete(true);
      // Auto-cancel after a few seconds if user doesn't confirm.
      setTimeout(() => setConfirmDelete(false), 4000);
    }
  };

  return (
    <div
      className={clsx(
        "group flex items-end gap-2",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isOwn && (
        <div
          className={clsx(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
            avatar.bg,
            avatar.text
          )}
          aria-hidden="true"
        >
          {message.sender_initials}
        </div>
      )}

      <div className={clsx("flex flex-col", isOwn ? "items-end" : "items-start")}>
        <div
          className={clsx(
            "flex max-w-[80vw] flex-col gap-1 rounded-2xl px-3.5 py-2 text-sm sm:max-w-md",
            isOwn
              ? "rounded-br-md bg-brand-600 text-white"
              : "rounded-bl-md bg-white text-ink-900 shadow-sm"
          )}
        >
          {!isOwn && (
            <p className="text-xs font-semibold text-ink-700">{message.sender_name}</p>
          )}
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
          <div
            className={clsx(
              "flex items-center gap-1 self-end text-[10px]",
              isOwn ? "text-brand-100" : "text-ink-500"
            )}
          >
            <span>{formatTime(message.created_at)}</span>
            {isOwn && <Ticks readByOthers={message.read_by_others} />}
          </div>
        </div>

        {isOwn && onDelete && (
          <button
            onClick={handleDeleteClick}
            onBlur={() => setConfirmDelete(false)}
            className={clsx(
              "mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium opacity-0 transition-opacity group-hover:opacity-100",
              confirmDelete
                ? "bg-danger-500 text-white opacity-100"
                : "text-ink-500 hover:bg-danger-50 hover:text-danger-700"
            )}
          >
            <Trash2 size={10} />
            {confirmDelete ? "Confirm delete" : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}
