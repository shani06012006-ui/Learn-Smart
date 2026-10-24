// frontend/src/features/admin/components/InviteDeliveryFields.jsx
import { Mail, MessageCircle } from "lucide-react";

/*
  "How should the student receive their activation link?"
  Shared by the Create-Student modal and the Resend-link modal.

  value: { email: boolean, whatsapp: boolean, phone: string }
  (defaults and the payload helper live in ./inviteDelivery.js)
*/

function Choice({ icon: Icon, label, hint, checked, onChange }) {
  return (
    <label
      className={
        "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition " +
        (checked
          ? "border-purple-400 bg-purple-50/60"
          : "border-slate-200 bg-white hover:border-slate-300")
      }
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 accent-purple-600"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-950">
          <Icon size={14} aria-hidden="true" />
          {label}
        </span>
        <span className="block text-[11px] text-slate-400">{hint}</span>
      </span>
    </label>
  );
}

export default function InviteDeliveryFields({ value, onChange, phoneError, disabled = false }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <fieldset
      disabled={disabled}
      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
    >
      <legend className="px-1 text-xs font-bold text-slate-700">
        Send the activation link by
      </legend>

      <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Choice
          icon={Mail}
          label="E-mail"
          hint="Sent to the student's e-mail"
          checked={value.email}
          onChange={(v) => set({ email: v })}
        />
        <Choice
          icon={MessageCircle}
          label="WhatsApp"
          hint="Opens WhatsApp; you press Send"
          checked={value.whatsapp}
          onChange={(v) => set({ whatsapp: v })}
        />
      </div>

      {value.whatsapp && (
        <div className="mt-3">
          <label htmlFor="invite-phone" className="block text-xs font-bold text-slate-700">
            WhatsApp number
          </label>
          <input
            id="invite-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={value.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="+91 98765 43210"
            aria-invalid={phoneError ? "true" : "false"}
            className={
              "mt-1.5 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-navy-950 outline-none transition " +
              (phoneError
                ? "border-coral-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100"
                : "border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100")
            }
          />
          {phoneError ? (
            <p role="alert" className="mt-1 text-xs text-coral-600">{phoneError}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              Include the country code. The number is used once to open WhatsApp and is not saved.
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        The student opens the link once to choose their own password. It expires, and stops
        working as soon as it has been used or replaced.
      </p>
    </fieldset>
  );
}
