import clsx from "clsx";

export default function OnlineStatusBadge({ isOnline }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        className={clsx(
          "h-2 w-2 rounded-full",
          isOnline ? "bg-success-500" : "bg-ink-300"
        )}
        aria-hidden="true"
      />
      <span className={isOnline ? "text-success-700" : "text-ink-500"}>
        {isOnline ? "Online" : "Offline"}
      </span>
    </span>
  );
}
