export default function QuestionPaperPreview({ quiz }) {
  return (
    <div className="max-h-[70vh] overflow-y-auto pr-1">
      <div className="mb-4 border-b border-ink-300 pb-4">
        <h3 className="text-lg font-semibold text-ink-900">{quiz.title}</h3>
        {quiz.description && (
          <p className="mt-1 text-sm text-ink-700">{quiz.description}</p>
        )}
        <div className="mt-2 flex gap-4 text-xs text-ink-500">
          <span>Total marks: {quiz.total_marks}</span>
          <span>Duration: {quiz.duration_minutes} minutes</span>
          <span>Questions: {quiz.questions.length}</span>
        </div>
      </div>

      <ol className="flex flex-col gap-5">
        {quiz.questions.map((q, idx) => (
          <li key={q.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-ink-900">
                {idx + 1}. {q.text}
              </p>
              <span className="shrink-0 text-xs text-ink-500">
                [{q.marks} {q.marks === 1 ? "mark" : "marks"}]
              </span>
            </div>
            <ul className="mt-2 ml-4 flex flex-col gap-1">
              {q.choices.map((c, cIdx) => (
                <li key={c.id} className="text-sm text-ink-700">
                  ({String.fromCharCode(65 + cIdx)}) {c.text}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="mt-6 border-t border-ink-300 pt-3 text-xs text-ink-500">
        — End of question paper —
      </p>
    </div>
  );
}
