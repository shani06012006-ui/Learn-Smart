// frontend/src/features/teacher/components/EditStudentModal.jsx
import { useEffect, useState } from "react";
import { X, User, Mail, GraduationCap, Loader2, Save } from "lucide-react";
import {
  useGetGradesQuery,
  useUpdateTeacherStudentMutation,
} from "../../../store/api/realApi";

function Field({ icon: Icon, label, error, ...props }) {
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

export default function EditStudentModal({ open, student, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    grade_id: "",
  });
  const [error, setError] = useState(null);

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results || gradesData || [];

  const [updateStudent, { isLoading }] = useUpdateTeacherStudentMutation();

  useEffect(() => {
    if (student) {
      setForm({
        first_name: student.first_name || student.full_name?.split(" ")[0] || "",
        last_name: student.last_name || student.full_name?.split(" ").slice(1).join(" ") || "",
        email: student.email || "",
        grade_id: student.grade_id || "",
      });
      setError(null);
    }
  }, [student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await updateStudent({ id: student.id, ...form }).unwrap();
      onSaved?.();
    } catch (err) {
      setError(err?.data?.detail || "Failed to update student.");
    }
  };

  if (!open || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-navy-950">Edit Student</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-full">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field
              icon={User}
              label="First Name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
            />
            <Field
              icon={User}
              label="Last Name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
            />
          </div>

          <Field
            icon={Mail}
            type="email"
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Grade</label>
            <div className="relative">
              <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={form.grade_id}
                onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              >
                <option value="">— Select grade —</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : (
                <><Save size={14} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}