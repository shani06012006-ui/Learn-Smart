import { useMemo, useState } from "react";
import { Plus, Trash2, Edit3, Users, Layers } from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import {
  useGetAdminSectionsQuery,
  useCreateAdminSectionMutation,
  useUpdateAdminSectionMutation,
  useDeleteAdminSectionMutation,
  useGetGradesQuery,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

function SectionFormModal({ open, onClose, editing, grades, onSaved }) {
  const isEdit = Boolean(editing);
  const [gradeId, setGradeId] = useState(editing?.grade_id || "");
  const [name, setName] = useState(editing?.name || "");
  const [capacity, setCapacity] = useState(editing?.capacity || 40);
  const [room, setRoom] = useState(editing?.room || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [create] = useCreateAdminSectionMutation();
  const [update] = useUpdateAdminSectionMutation();

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      const body = { name, capacity: Number(capacity), room };
      if (isEdit) {
        await update({ id: editing.id, ...body }).unwrap();
      } else {
        await create({ grade_id: gradeId, ...body }).unwrap();
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Section" : "New Section"}>
      {error && (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {!isEdit && (
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Grade</span>
            <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">— Select grade —</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Section name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. A, B, 5-A" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Capacity</span>
          <input type="number" min={1} max={200} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Room</span>
          <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Room 201" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-3">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={saving}>{saving ? "Saving…" : isEdit ? "Update" : "Create"}</Button>
      </div>
    </Modal>
  );
}

export default function AdminSectionsPage() {
  const [gradeFilter, setGradeFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];

  const { data, isLoading, isError, error, refetch } = useGetAdminSectionsQuery({ grade: gradeFilter });
  const [deleteSection] = useDeleteAdminSectionMutation();

  const sections = useMemo(() => {
    const list = data?.results ?? data ?? [];
    return Array.isArray(list) ? list : [];
  }, [data]);

  const grouped = useMemo(() => {
    const map = new Map();
    sections.forEach((s) => {
      const key = s.grade_id;
      if (!map.has(key)) map.set(key, { grade_name: s.grade_name, grade_level: s.grade_level, sections: [] });
      map.get(key).sections.push(s);
    });
    return Array.from(map.values()).sort((a, b) => a.grade_level - b.grade_level);
  }, [sections]);

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete section "${s.grade_name} - ${s.name}"?`)) return;
    try { await deleteSection(s.id).unwrap(); } catch (e) { alert(extractErrorMessage(e)); }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">Sections</h1>
          <p className="mt-1 text-sm text-slate-500">Manage sections (5-A, 5-B, 5-C) within each grade.</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} /> New Section
        </Button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">All grades</option>
          {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {isLoading && <LoadingState label="Loading sections…" />}
      {isError && <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />}

      {!isLoading && !isError && grouped.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500"><Layers size={26} /></span>
          <h2 className="font-display text-xl font-extrabold text-navy-950">No sections yet</h2>
          <p className="text-sm text-slate-500">Create your first section for a grade.</p>
        </div>
      )}

      {grouped.map((g) => (
        <section key={g.grade_name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-slate-600">{g.grade_name}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.sections.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-navy-950">Section {s.name}</p>
                    {s.room && <p className="text-[11px] text-slate-500">{s.room}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => { setEditing(s); setFormOpen(true); }} className="rounded-lg bg-white p-1.5 text-slate-500 hover:bg-slate-100">
                      <Edit3 size={13} />
                    </button>
                    <button type="button" onClick={() => handleDelete(s)} className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1"><Users size={11} /> {s.student_count}/{s.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <SectionFormModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} grades={grades} onSaved={refetch} />
    </div>
  );
}