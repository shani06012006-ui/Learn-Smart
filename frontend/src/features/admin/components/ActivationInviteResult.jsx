// frontend/src/features/admin/components/ActivationInviteResult.jsx
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  KeyRound,
} from "lucide-react";

function formatExpiry(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusRow({ tone, icon: Icon, children }) {
  const tones = {
    ok: "border-emerald-100 bg-emerald-50 text-emerald-700",
    warn: "border-amber-100 bg-amber-50 text-amber-800",
    info: "border-slate-200 bg-slate-50 text-slate-600",
  };
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${tones[tone]}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function ActivationInviteResult({ email, invitation }) {
  const [copied, setCopied] = useState(null);
  const inputRef = useRef(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      inputRef.current?.select();
    }
  };

  const expires = formatExpiry(invitation.expires_at);
  const pin = invitation.student_pin;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-navy-950">
        <CheckCircle2 size={18} className="text-emerald-600" aria-hidden="true" />
        Student account created
      </div>

      {/* PIN CARD — new */}
      {pin && (
        <div className="rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound size={18} className="text-purple-700" />
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Student Login PIN
            </p>
          </div>
          <p className="font-mono text-4xl font-extrabold tracking-[0.4em] text-purple-900 text-center my-3">
            {pin}
          </p>
          <p className="text-xs text-purple-700 text-center">
            Share this 6-digit code with the student. They'll use it at{" "}
            <span className="font-mono font-bold">/student-login</span>.
          </p>
          <button
            type="button"
            onClick={() => copy(pin, "pin")}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
          >
            {copied === "pin" ? (
              <>
                <Check size={14} /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy PIN
              </>
            )}
          </button>
        </div>
      )}

      {/* Status rows */}
      <div className="flex flex-col gap-2">
        {invitation.email_sent ? (
          <StatusRow tone="ok" icon={Check}>
            Invitation email sent to <strong className="break-all">{email}</strong>.
          </StatusRow>
        ) : invitation.email_error ? (
          <StatusRow tone="warn" icon={AlertTriangle}>
            {invitation.email_error}
          </StatusRow>
        ) : (
          <StatusRow tone="info" icon={Info}>
            No e-mail was sent. Share the link below yourself.
          </StatusRow>
        )}

        {invitation.whatsapp_url && (
          <StatusRow tone="info" icon={Info}>
            <p>
              WhatsApp message to <strong>{invitation.whatsapp_to}</strong> is
              ready. Check that this is the right number, then press{" "}
              <em>Send</em> in WhatsApp.
            </p>
            <a
              href={invitation.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              <ExternalLink size={13} aria-hidden="true" />
              Open WhatsApp
            </a>
          </StatusRow>
        )}
      </div>

      {/* Activation link */}
      <div>
        <label
          htmlFor="activation-link"
          className="block text-xs font-bold text-slate-700"
        >
          One-time activation link (for password setup)
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="activation-link"
            ref={inputRef}
            readOnly
            value={invitation.activation_url}
            onFocus={(e) => e.target.select()}
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-600 outline-none focus:border-purple-400"
          />
          <button
            type="button"
            onClick={() => copy(invitation.activation_url, "url")}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {copied === "url" ? (
              <Check size={14} className="text-emerald-600" />
            ) : (
              <Copy size={14} />
            )}
            {copied === "url" ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          Valid for {invitation.expires_in_hours} hours
          {expires ? ` (until ${expires})` : ""} and works once. This is the
          only time the link is shown. If it is lost, use{" "}
          <em>Resend activation link</em> on the student&apos;s page.
        </p>
      </div>
    </div>
  );
}