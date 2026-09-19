import { useState } from "react";
import clsx from "clsx";
import { Check, CheckCheck, Trash2 } from "lucide-react";

import Avatar from "../../../components/ui/Avatar";
import { formatClockTime } from "../../../utils/formatters";

function Ticks({ message }) {
  const read = !!message.read_by_others;
  const ageMs = Date.now() - new Date(message.created_at).getTime();
  const delivered = read || ageMs > 2000;

  if (read) {
    return <CheckCheck size={14} className="text-brand-100" aria-label="Read" />;
  }
  if (delivered) {
    return (
      <CheckCheck size={14} className="text-brand-100/70" aria-label="Delivered" />
    );
  }
  return <Check size={14} className="text-brand-100/70" aria-label="Sent" />;
}

export default function MessageBubble({
  message,
  isOwn,
  onDelete,
  isGrouped = false,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete?.(message);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
    }
  };

  return (
    <div
      className={clsx(
        "group flex items-end gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
        isGrouped ? "mt-0.5" : "mt-3"
      )}
    >
      {!isOwn && !isGrouped ? (
        <Avatar
          userId={message.sender_id}
          initials={message.sender_initials}
          size="sm"
        />
      ) : !isOwn ? (
        <span className="h-7 w-7 shrink-0" aria-hidden="true" />
      ) : null}

      <div className={clsx("flex flex-col", isOwn ? "items-end" : "items-start")}>
        <div
          className={clsx(
            "flex max-w-[80vw] flex-col gap-1 rounded-2xl px-3.5 py-2 text-sm sm:max-w-md",
            isOwn
              ? "rounded-br-md bg-brand-600 text-white"
              : "rounded-bl-md bg-white text-ink-900 shadow-sm",
            isGrouped && (isOwn ? "rounded-tr-md" : "rounded-tl-md")
          )}
        >
          {!isOwn && !isGrouped && (
            <p className="text-xs font-semibold text-ink-700">
              {message.sender_name}
            </p>
          )}
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
          <div
            className={clsx(
              "flex items-center gap-1 self-end text-[10px]",
              isOwn ? "text-brand-100/80" : "text-ink-500"
            )}
          >
            <span>{formatClockTime(message.created_at)}</span>
            {isOwn && <Ticks message={message} />}
          </div>
        </div>

        {isOwn && onDelete && (
          <button
            onClick={handleDeleteClick}
            onBlur={() => setConfirmDelete(false)}
            className={clsx(
              "mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-opacity",
              "lg:opacity-0 lg:group-hover:opacity-100",
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
