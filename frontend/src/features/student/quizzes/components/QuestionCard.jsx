export default function QuestionCard({ question, index, selectedChoiceId, onSelect }) {
  return (
    <section className="rounded-xl border border-ink-300 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
        Question {index + 1} · {question.marks}{" "}
        {question.marks === 1 ? "mark" : "marks"}
      </p>
      <p className="mt-1 text-sm font-medium text-ink-900">{question.text}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {question.choices.map((choice) => {
          const selected = choice.id === selectedChoiceId;
          return (
            <li key={choice.id}>
              <label
                className={
                  "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors " +
                  (selected
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-300 bg-white text-ink-700 hover:bg-ink-100/60")
                }
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={selected}
                  onChange={() => onSelect(choice.id)}
                  className="focus-ring h-4 w-4 text-brand-600"
                />
                {choice.text}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
