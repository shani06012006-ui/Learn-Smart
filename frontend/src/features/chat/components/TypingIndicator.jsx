export default function TypingIndicator({ name }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 shadow-sm">
        {name && (
          <span className="text-xs font-medium text-ink-500">{name}</span>
        )}
        <span className="sr-only">{name ? `${name} is typing` : "Typing"}</span>
        <span className="flex items-center gap-1" aria-hidden="true">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-ink-500"
      style={{ animationDelay: delay, animationDuration: "1s" }}
      aria-hidden="true"
    />
  );
}
