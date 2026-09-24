export default function EmptyState({
  icon: Icon,
  title = "Nothing here yet",
  message,
  action,
  className = "",
}) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center rounded-card border border-dashed border-ink-300 bg-white px-6 py-10 text-center " +
        className
      }
    >
      {Icon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-500">
          <Icon size={18} />
        </span>
      )}
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {message && (
        <p className="mt-1 max-w-xs text-xs text-ink-500">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}