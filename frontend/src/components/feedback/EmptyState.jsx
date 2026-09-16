export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 py-16 text-center">
      {Icon && <Icon className="mb-1 h-10 w-10 text-ink-300" strokeWidth={1.5} />}
      <p className="font-medium text-ink-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
