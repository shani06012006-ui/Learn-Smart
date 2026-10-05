/**
 * ReactionBar - Instagram/WhatsApp-style reactions.
 *
 * Behavior (wishlist-style):
 *  - ONE reaction per user per message (backend enforces via unique constraint).
 *  - Click a chip       -> if it's YOUR emoji, remove it immediately (toggle off).
 *                          if it's NOT yours, ADD it (replacing any existing reaction of yours).
 *  - Hover a chip       -> tooltip with "who reacted".
 *  - Click info icon    -> "who reacted" popover with avatars + names.
 *  - "+" button         -> emoji dropdown with 12 emojis.
 *  - Pop animation      -> framer-motion on tap.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmilePlus, Info } from "lucide-react";

import Avatar from "./Avatar";
import Badge from "./Badge";

const ALL_EMOJIS = [
  "\U0001F44D", "\u2764\uFE0F", "\u2705", "\U0001F389", "\U0001F440",
  "\U0001F600", "\U0001F602", "\U0001F525", "\U0001F64F", "\u2B50",
  "\U0001F4AF", "\U0001F44F",
];

export default function ReactionBar({ message, onToggle, disabled = false }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reactorsFor, setReactorsFor] = useState(null);
  const wrapRef = useRef(null);

  const reactions = message.reactions || [];
  const reactedEmojis = new Set(reactions.map((r) => r.emoji));
  const myReaction = reactions.find((r) => r.reacted_by_me);

  useEffect(() => {
    if (!pickerOpen && !reactorsFor) return;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPickerOpen(false);
        setReactorsFor(null);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setPickerOpen(false);
        setReactorsFor(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen, reactorsFor]);

  /* Click chip = always toggle. No popover on click. */
  function handleChipClick(emoji) {
    if (disabled) return;
    onToggle(message.id, emoji);
  }

  /* Info icon click = show who reacted */
  function handleInfoClick(emoji) {
    setReactorsFor((prev) => (prev === emoji ? null : emoji));
  }

  function handlePickEmoji(emoji) {
    setPickerOpen(false);
    onToggle(message.id, emoji);
  }

  return (
    <div ref={wrapRef} className="mt-2 flex flex-wrap items-center gap-1.5">
      {/* Existing reaction chips */}
      {reactions.map((r) => (
        <ReactionChip
          key={r.emoji}
          reaction={r}
          onClick={() => handleChipClick(r.emoji)}
          onInfo={() => handleInfoClick(r.emoji)}
        />
      ))}

      {/* Emoji picker button */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setReactorsFor(null);
            setPickerOpen((v) => !v);
          }}
          className={
            "flex h-7 w-7 items-center justify-center rounded-full border text-slate-400 transition " +
            (pickerOpen
              ? "border-purple-300 bg-purple-50 text-purple-600"
              : "border-slate-200 bg-white hover:border-slate-300 hover:text-slate-600")
          }
          title="Add reaction"
        >
          <SmilePlus size={13} />
        </button>

        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-9 z-30 w-[248px] rounded-2xl border border-slate-200 bg-white p-2 shadow-elevated-lg"
            >
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                React with
              </p>
              <div className="grid grid-cols-6 gap-1">
                {ALL_EMOJIS.map((emoji) => {
                  const isMine = myReaction?.emoji === emoji;
                  return (
                    <motion.button
                      key={emoji}
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handlePickEmoji(emoji)}
                      className={
                        "flex h-9 w-9 items-center justify-center rounded-xl text-lg transition " +
                        (isMine
                          ? "bg-purple-100 ring-1 ring-purple-300"
                          : "hover:bg-slate-100")
                      }
                      title={emoji}
                    >
                      {emoji}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* "Who reacted" popover */}
      <AnimatePresence>
        {reactorsFor && (
          <ReactorsPopover
            emoji={reactorsFor}
            users={reactions.find((r) => r.emoji === reactorsFor)?.users || []}
            onClose={() => setReactorsFor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -- Individual chip --------------------------------------------------- */
function ReactionChip({ reaction, onClick, onInfo }) {
  const { emoji, count, reacted_by_me, users } = reaction;
  return (
    <div
      className={
        "flex items-center gap-0.5 rounded-full border text-xs font-semibold transition " +
        (reacted_by_me
          ? "border-purple-400 bg-purple-500 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
      }
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={onClick}
        title={reacted_by_me ? "Click to remove your reaction" : "React with this emoji"}
        className="flex items-center gap-1 rounded-l-full px-2 py-0.5"
      >
        <span className="text-[13px] leading-none">{emoji}</span>
        <span>{count}</span>
      </motion.button>

      {/* Info icon only when count > 0, to see who reacted */}
      {count > 0 && (
        <button
          type="button"
          onClick={onInfo}
          title="See who reacted"
          className={
            "flex items-center rounded-r-full px-1.5 py-0.5 transition " +
            (reacted_by_me ? "hover:bg-purple-600" : "hover:bg-slate-100")
          }
        >
          <Info size={11} />
        </button>
      )}
    </div>
  );
}

/* -- Reactors popover -------------------------------------------------- */
function ReactorsPopover({ emoji, users, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.12 }}
      className="ml-1 inline-flex flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-elevated-lg"
    >
      <div className="flex items-center justify-between gap-3 px-2 pb-1">
        <p className="text-[11px] font-bold text-slate-600">
          {emoji} - {users.length} {users.length === 1 ? "person" : "people"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded text-[10px] text-slate-400 hover:text-slate-600"
        >
          x
        </button>
      </div>
      <ul className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-2 rounded-lg px-2 py-1">
            <Avatar userId={u.id} initials={u.initials} size="sm" />
            <span className="text-xs font-semibold text-navy-950">
              {u.full_name}
            </span>
            {u.is_self && <Badge variant="success" dot>You</Badge>}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
