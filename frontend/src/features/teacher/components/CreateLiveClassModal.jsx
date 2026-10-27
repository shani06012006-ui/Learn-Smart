// frontend/src/features/teacher/components/CreateLiveClassModal.jsx
import { useState } from "react";
import { useGetClassesQuery, useCreateLiveClassMutation } from "../../../store/api/realApi";
import { X, Loader2, Video } from "lucide-react";

export default function CreateLiveClassModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    class_course_id: "",
    scheduled_date: new Date().toISOString().split("T")[0],
    scheduled_start: "",
    scheduled_end: "",
    room: "",
    meeting_url: "",
  });
  const [error, setError] = useState(null);

  const { data: classesData } = useGetClassesQuery();
  const classes = classesData?.results || classesData || [];

  const [createLiveClass, { isLoading }] = useCreateLiveClassMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const start = new Date(`${form.scheduled_date}T${form.scheduled_start}:00`).toISOString();
      const end = new Date(`${form.scheduled_date}T${form.scheduled_end}:00`).toISOString();

      await createLiveClass({
        ...form,
        scheduled_start: start,
        scheduled_end: end,
      }).unwrap();

      onClose();
      setForm({ ...form, scheduled_start: "", scheduled_end: "", room: "", meeting_url: "" });
    } catch (err) {
      setError(err?.data?.detail || "Failed to create live class. Please check your inputs.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
            <Video size={18} className="text-purple-600" /> Schedule Live Class
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Class / Course</label>
            <select
              required
              value={form.class_course_id}
              onChange={(e) => setForm({ ...form, class_course_id: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
            >
              <option value="">— Select Class —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
            <input
              type="date"
              required
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={form.scheduled_start}
                onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">End Time</label>
              <input
                type="time"
                required
                value={form.scheduled_end}
                onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Room (Optional)</label>
            <input
              type="text"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
              placeholder="e.g. Room 101"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Meeting URL (Optional)</label>
            <input
              type="url"
              value={form.meeting_url}
              onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
              placeholder="https://zoom.us/..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-5 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg shadow-purple-500/30 transition flex items-center gap-2">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}