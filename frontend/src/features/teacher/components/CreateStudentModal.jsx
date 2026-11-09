// frontend/src/features/teacher/components/CreateStudentModal.jsx
import { useState } from "react";
import {
  X, User, Mail, Phone, Check, Loader2, KeyRound, Link2,
  Copy, CheckCircle2, Sparkles, GraduationCap,
} from "lucide-react";
import {
  useCreateTeacherStudentMutation,
  useGetGradesQuery,
} from "../../../store/api/realApi";

function Input({ icon: Icon, label, error, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
        <input
          {...props}
          className={
            "h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm outline-none transition " +
            (error
              ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              : "border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100")
          }
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export default function CreateStudentModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    grade_id: "",
    send_via: ["email"],
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results || gradesData || [];

  const [createStudent, { isLoading }] = useCreateTeacherStudentMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = "First name is required";
    if (!form.last_name.trim()) errs.last_name = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    if (!form.grade_id) errs.grade_id = "Please select a grade";
    if (form.send_via.includes("whatsapp") && !form.phone.trim()) {
      errs.phone = "WhatsApp number is required";
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      const data = await createStudent({
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        grade_id: form.grade_id,
        send_via: form.send_via,
        phone: form.phone,
      }).unwrap();
      setResult(data)

      setResult(data);
    } catch (err) {
      const detail = err?.data?.error?.detail;
      const fieldErrors = err?.data?.error;
      if (typeof fieldErrors === "object") {
        const map = {};
        Object.entries(fieldErrors).forEach(([k, v]) => {
          map[k] = Array.isArray(v) ? v[0] : v;
        });
        setErrors(map);
      } else if (typeof detail === "string") {
        setErrors({ general: detail });
      } else {
        setErrors({ general: "Failed to create student." });
      }
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const reset = () => {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      grade_id: "",
      send_via: ["email"],
      phone: "",
    });
    setErrors({});
    setResult(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            {result ? "Student created" : "Create a Student"}
          </h2>
          <button onClick={reset} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
                    {result ? (
            <div className="space-y-4">
              <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
                result.resent 
                  ? "bg-amber-50 border-amber-200" 
                  : "bg-emerald-50 border-emerald-200"
              }`}>
                <CheckCircle2 size={24} className={result.resent ? "text-amber-600 shrink-0" : "text-emerald-600 shrink-0"} />
                <div>
                  <p className={`font-bold ${result.resent ? "text-amber-900" : "text-emerald-900"}`}>
                    {result.resent 
                      ? "Student already exists — credentials resent" 
                      : "Student account created successfully"}
                  </p>
                  <p className={`text-xs ${result.resent ? "text-amber-700" : "text-emerald-700"}`}>
                    {result.student?.email || result.email}
                  </p>
                  {result.resent && (
                    <p className="text-xs text-amber-700 mt-1">
                      A new PIN was generated and a fresh email was sent.
                    </p>
                  )}
                </div>
              </div>

              {/* PIN Card */}
              {result.student_pin && (
                <div className="rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound size={16} className="text-purple-700" />
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-700">Student Login PIN</p>
                  </div>
                  <p className="font-mono text-4xl font-extrabold tracking-[0.4em] text-purple-900 text-center my-3">
                    {result.student_pin}
                  </p>
                  <p className="text-xs text-purple-700 text-center">
                    Share this with the student. They log in at <span className="font-mono font-bold">/student-login</span>.
                  </p>
                  <button
                    onClick={() => copy(result.student_pin, "pin")}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
                  >
                    {copied === "pin" ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy PIN</>}
                  </button>
                </div>
              )}

              {/* Activation Link */}
              {result.invitation?.activation_url && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 size={16} className="text-slate-600" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Password Setup Link</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">One-time link for the student to set a permanent password.</p>
                  <input
                    readOnly
                    value={result.invitation.activation_url}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700"
                  />
                  <button
                    onClick={() => copy(result.invitation.activation_url, "url")}
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 w-full"
                  >
                    {copied === "url" ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy link</>}
                  </button>
                </div>
              )}

              {result.invitation?.email_sent && (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                  <Mail size={12} /> Invitation email sent to the student
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input icon={User} label="First Name" placeholder="Aarav" value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })} error={errors.first_name} required />
                <Input icon={User} label="Last Name" placeholder="Sharma" value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })} error={errors.last_name} required />
              </div>

              <Input icon={Mail} type="email" label="Email" placeholder="aarav@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grade</label>
                <div className="relative">
                  <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={form.grade_id}
                    onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                    className={"h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm outline-none transition " +
                      (errors.grade_id
                        ? "border-rose-300"
                        : "border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100")}
                  >
                    <option value="">— Select grade —</option>
                    {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                {errors.grade_id && <p className="mt-1 text-xs text-rose-600">{errors.grade_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Send the login credentials via</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${
                    form.send_via.includes("email") ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.send_via.includes("email")}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.send_via, "email"]
                          : form.send_via.filter((v) => v !== "email");
                        setForm({ ...form, send_via: next });
                      }}
                      className="rounded"
                    />
                    <Mail size={14} />
                    <span className="text-sm font-semibold">Email</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${
                    form.send_via.includes("whatsapp") ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.send_via.includes("whatsapp")}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.send_via, "whatsapp"]
                          : form.send_via.filter((v) => v !== "whatsapp");
                        setForm({ ...form, send_via: next });
                      }}
                      className="rounded"
                    />
                    <Phone size={14} />
                    <span className="text-sm font-semibold">WhatsApp</span>
                  </label>
                </div>
              </div>

              {form.send_via.includes("whatsapp") && (
                <Input icon={Phone} label="WhatsApp Number" placeholder="+91 98765 43210" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
              )}

              {errors.general && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{errors.general}</div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/30 shrink-0">
          {result ? (
            <button onClick={() => { reset(); onCreated?.(); }} className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-700">
                Done
            </button>
          ) : (
            <>
              <button type="button" onClick={reset} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" form="" onClick={handleSubmit} disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50">
                {isLoading ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Sparkles size={14} /> Create & send link</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}