// Shared helper — renders a readable class/grade label.
export function classLabel(klass) {
  if (!klass) return "";
  const gradePart = klass.grade?.name || klass.grade_name || null;
  const namePart = klass.name || "Untitled class";
  const subjectPart = klass.subject ? ` · ${klass.subject}` : "";
  return gradePart ? `${gradePart} — ${namePart}${subjectPart}` : `${namePart}${subjectPart}`;
}

export function classShortLabel(klass) {
  if (!klass) return "";
  const gradePart = klass.grade?.name || klass.grade_name || null;
  const namePart = klass.name || "Class";
  return gradePart ? `${gradePart} · ${namePart}` : namePart;
}