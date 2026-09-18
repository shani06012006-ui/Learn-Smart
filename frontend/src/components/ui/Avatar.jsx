import clsx from "clsx";

import { avatarColor } from "../../utils/avatarColor";

// Shared avatar primitive. Renders a circle with the user's initials,
// background color derived deterministically from `userId`. Uses the same
// `avatarColor` palette across the app for consistency.

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-14 w-14 text-lg",
  "2xl": "h-20 w-20 text-2xl",
};

export default function Avatar({
  userId,
  initials,
  size = "md",
  className,
  // Optional: force a neutral (gray) background instead of the deterministic
  // color. Useful for group avatars where we want a distinct look.
  neutral = false,
}) {
  const palette = avatarColor(userId || initials || "?");

  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZES[size] || SIZES.md,
        neutral ? "bg-ink-100 text-ink-700" : `${palette.bg} ${palette.text}`,
        className
      )}
      aria-hidden="true"
    >
      {initials || "?"}
    </div>
  );
}
