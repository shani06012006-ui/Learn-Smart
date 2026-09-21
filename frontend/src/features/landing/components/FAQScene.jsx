import { ChevronDown } from "lucide-react";

import LearningScene from "./LearningScene";

const FAQS = [
  {
    q: "What is Learn-Smart?",
    a: "An AI-assisted learning platform that combines classes, materials, quizzes, live sessions, and progress tracking in one place for students and teachers.",
  },
  {
    q: "Who can use Learn-Smart?",
    a: "Two roles: students, who join a class with a code from their teacher, and teachers, who create classes, share materials, run quizzes, and monitor performance.",
  },
  {
    q: "How do students join a class?",
    a: "The teacher adds a student to the class, and the platform generates a unique 6-character joining code. The student enters that code on the Join a class page to activate the enrollment.",
  },
  {
    q: "Can teachers create quizzes?",
    a: "Yes. Teachers build multiple-choice quizzes, add and reorder questions, set marks and duration, preview the question paper, and publish when ready.",
  },
  {
    q: "Are live classes supported?",
    a: "Yes. Teachers schedule a session for a class with title, date, time, duration, and an optional meeting link. Enrolled students get a notification and can join from their Live Classes page.",
  },
  {
    q: "Can students track their performance?",
    a: "Students see marks, accuracy, completion rate, strong and weak topics, and a trend of recent assessments, all computed from the quizzes they have taken.",
  },
  {
    q: "How do announcements and notifications work?",
    a: "Teachers post announcements to a class. Every enrolled student receives an in-app notification. Notifications appear in the bell menu without needing a page refresh.",
  },
  {
    q: "How does the platform support personalized learning?",
    a: "Learn-Smart analyzes quiz results and topic accuracy to identify weak topics per student, then surfaces recommended materials and follow-up quizzes to close those gaps.",
  },
];

export default function FAQScene() {
  return (
    <LearningScene
      id="faq"
      tone="muted"
      eyebrow="FAQ"
      title="Questions, answered."
      subtitle="Everything you need to know before you start."
      full
    >
      <div className="mx-auto max-w-3xl">
        <ul className="flex flex-col gap-3">
          {FAQS.map((item) => (
            <li
              key={item.q}
              className="rounded-xl border border-ink-200 bg-white shadow-card"
            >
              <details className="group">
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-5 py-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-100/60">
                  <span>{item.q}</span>
                  <ChevronDown
                    size={16}
                    className="shrink-0 text-ink-500 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-ink-200 px-5 py-4 text-sm leading-relaxed text-ink-500">
                  {item.a}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </LearningScene>
  );
}
