export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = "",
}) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-ink-300 bg-white py-14 px-6 text-center " +
        className
      }
    >
      {Icon && (
        <Icon
          className="mb-1 h-10 w-10 text-ink-300"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
      <p className="font-medium text-ink-700">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-ink-500">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
