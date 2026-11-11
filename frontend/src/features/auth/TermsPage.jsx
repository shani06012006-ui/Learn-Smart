// frontend/src/features/auth/TermsPage.jsx
import { Link } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";

const COMPANY = "Learn Smart";
const CONTACT_EMAIL = "support@learnsmart.example";
const LAST_UPDATED = "11 November 2026";

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of these terms",
    body: [
      `By creating an account or using ${COMPANY} (the "Platform"), you agree to these Terms and Conditions. If you use the Platform on behalf of a school or other organisation, you confirm that you are authorised to accept these terms for it.`,
      "If you do not agree, do not use the Platform.",
    ],
  },
  {
    id: "accounts",
    title: "2. Accounts and eligibility",
    body: [
      "Teacher accounts can be created through the sign-up form, after the email address is verified with a one-time code.",
      "Student and administrator accounts are created by a school administrator. Students activate their account through a one-time link sent to them.",
      "You are responsible for keeping your password confidential and for all activity under your account. Tell us promptly if you suspect unauthorised access.",
    ],
  },
  {
    id: "use",
    title: "3. Acceptable use",
    body: [
      "You agree to use the Platform only for lawful educational purposes. You must not:",
    ],
    list: [
      "upload content that is unlawful, abusive, hateful, or infringes someone else's rights;",
      "attempt to access accounts, classes, or data that do not belong to you;",
      "interfere with the security or operation of the Platform, including automated scraping or load testing without permission;",
      "use the Platform to harass, impersonate, or target students or staff.",
    ],
  },
  {
    id: "content",
    title: "4. Your content",
    body: [
      "You keep ownership of the lesson material, PDFs, quizzes, announcements, and messages you upload or create (your \"Content\").",
      "You grant us a limited licence to host, process, and display your Content solely to provide the Platform to you and your students.",
      "You confirm that you have the right to upload and share all Content, including any third-party material it contains.",
    ],
  },
  {
    id: "ai",
    title: "5. AI-generated quizzes and grading",
    body: [
      "Quizzes generated from uploaded documents are produced automatically and may contain errors. You are responsible for reviewing, editing, and approving every quiz before it is published to students.",
      "Automatic grading is provided as a convenience. Final assessment decisions remain with the teacher and the school.",
    ],
  },
  {
    id: "privacy",
    title: "6. Personal data",
    body: [
      `${COMPANY} processes personal data, including student names, email addresses, attendance, and assessment results, on behalf of the school. Our handling of personal data is described in our Privacy Policy.`,
      "Schools and teachers must ensure they have a lawful basis to share student information with the Platform, and must follow the data protection rules that apply in their jurisdiction.",
    ],
  },
  {
    id: "availability",
    title: "7. Availability",
    body: [
      "We work to keep the Platform available, but we do not guarantee uninterrupted access. We may suspend access for maintenance, security, or to fix faults, and will try to give notice where practical.",
    ],
  },
  {
    id: "termination",
    title: "8. Suspension and termination",
    body: [
      "We may suspend or close an account that breaches these terms or puts the Platform or other users at risk.",
      "You may stop using the Platform at any time. Your school may ask us to deactivate or delete accounts it manages.",
    ],
  },
  {
    id: "liability",
    title: "9. Limitation of liability",
    body: [
      "To the maximum extent permitted by law, the Platform is provided \"as is\". We are not liable for indirect or consequential losses, or for loss of data caused by factors outside our reasonable control.",
      "Nothing in these terms limits liability that cannot be excluded by law.",
    ],
  },
  {
    id: "changes",
    title: "10. Changes to these terms",
    body: [
      "We may update these terms from time to time. When we make material changes, we will notify account holders by email or in the Platform. Continued use after the effective date means you accept the updated terms.",
    ],
  },
  {
    id: "governing-law",
    title: "11. Governing law",
    body: [
      "These terms are governed by the laws of the jurisdiction in which the operating company is registered. Disputes are subject to the exclusive jurisdiction of its courts, unless local law provides otherwise.",
    ],
  },
  {
    id: "contact",
    title: "12. Contact",
    body: [
      `Questions about these terms can be sent to ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f7f3]">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-sage-200">
              <GraduationCap size={18} />
            </span>
            <span className="font-display text-base font-bold text-ink-900">{COMPANY}</span>
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to sign up
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink-100 sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Legal</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Terms and Conditions
          </h1>
          <p className="mt-3 text-sm text-ink-500">Last updated: {LAST_UPDATED}</p>

          <nav aria-label="On this page" className="mt-8 rounded-xl bg-ink-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Contents</p>
            <ol className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-700 underline-offset-4 hover:text-ink-900 hover:underline">
                    {s.title.replace(/^\d+\.\s/, "")}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="font-display text-lg font-bold text-ink-900">{s.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-700">
                  {s.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {s.list && (
                    <ul className="list-disc space-y-1.5 pl-5">
                      {s.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            This document is a starting template. Have it reviewed by a qualified lawyer, and fill in your
            legal entity name, jurisdiction, and contact details before you publish it.
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-ink-500">
          © {new Date().getFullYear()} {COMPANY}. All rights reserved.
        </p>
      </main>
    </div>
  );
}