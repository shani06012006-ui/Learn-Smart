// frontend/src/features/admin/components/TimetableEntryModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, BookOpen, X } from "lucide-react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  useCreateAdminTimetableMutation,
  useUpdateAdminTimetableMutation,
  useGetAdminCoursesQuery,
} from "../../../store/api/realApi";

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const INITIAL = {
  class_course_id: "",
  class_name: "",
  day_of_week: 0,
  start_time: "09:00",
  end_time: "10:00",
  room: "",
};

export default function TimetableEntryModal({ open, onClose, entry = null }) {
  const isEdit = Boolean(entry);

  const [createEntry, { isLoading: isCreating }] = useCreateAdminTimetableMutation();
  const [updateEntry, { isLoading: isUpdating }] = useUpdateAdminTimetableMutation();
  const { data: coursesData, isLoading: isLoadingCourses } = useGetAdminCoursesQuery(
    { is_archived: false },
    { skip: !open }
  );

  const courses = useMemo(() => coursesData?.results || [], [coursesData]);
  const isLoading = isCreating || isUpdating;

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [query, setQuery] = useState(""); // what the admin is typing
  const [open_, setOpen_] = useState(false); // dropdown visible
  const wrapperRef = useRef(null);

  // Reset when opened or when editing target changes
  useEffect(() => {
    if (!open) return;
    if (entry) {
      setForm({
        class_course_id: entry.class_course?.id || "",
        class_name: entry.class_course?.name || "",
        day_of_week: entry.day_of_week ?? 0,
        start_time: entry.start_time?.slice(0, 5) || "09:00",
        end_time: entry.end_time?.slice(0, 5) || "10:00",
        room: entry.room || "",
      });
      setQuery(entry.class_course?.name || "");
    } else {
      setForm(INITIAL);
      setQuery("");
    }
    setErrors({});
    setFormError(null);
    setOpen_(false);
  }, [open, entry]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open_) return;
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen_(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open_]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses.slice(0, 6);
    return courses
      .filter((c) => {
        const hay = `${c.name} ${c.subject || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 6);
  }, [courses, query]);

  const exactMatch = matches.find(
    (c) => c.name.toLowerCase() === query.trim().toLowerCase()
  );

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setOpen_(true);
    // As soon as the admin types, we no longer have a selected course id.
    setForm((f) => ({
      ...f,
      class_course_id: "",
      class_name: value,
    }));
    if (errors.class_course_id) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.class_course_id;
        return next;
      });
    }
  };

  const handlePickCourse = (course) => {
    setForm((f) => ({
      ...f,
      class_course_id: course.id,
      class_name: course.name,
    }));
    setQuery(course.name);
    setOpen_(false);
    if (errors.class_course_id) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.class_course_id;
        return next;
      });
    }
  };

  const handleClear = () => {
    setQuery("");
    setForm((f) => ({ ...f, class_course_id: "", class_name: "" }));
    setOpen_(true);
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const trimmedName = form.class_name.trim();

    const next = {};
    if (!form.class_course_id && !trimmedName) {
      next.class_course_id = ["Pick a class or type a new one."];
    }
    if (!form.start_time) next.start_time = ["Required."];
    if (!form.end_time) next.end_time = ["Required."];
    if (form.end_time && form.start_time && form.end_time <= form.start_time) {
      next.end_time = ["End time must be after start time."];
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    const payload = {
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room.trim(),
    };
    if (form.class_course_id) {
      payload.class_course_id = form.class_course_id;
    } else {
      payload.class_name = trimmedName;
    }

    try {
      if (isEdit) {
        await updateEntry({ id: entry.id, ...payload }).unwrap();
      } else {
        await createEntry(payload).unwrap();
      }
      onClose();
    } catch (err) {
      const detail = err?.data?.error?.detail;
      if (typeof detail === "string") {
        setFormError(detail);
      } else if (Array.isArray(detail)) {
        setFormError(detail[0]);
      } else if (detail && typeof detail === "object") {
        setErrors(detail);
      } else {
        setFormError(
          isEdit ? "Could not update the entry." : "Could not create the entry."
        );
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit timetable entry" : "Add timetable entry"}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="timetable-entry-form" loading={isLoading}>
            {isEdit ? "Save changes" : "Add entry"}
          </Button>
        </>
      }
    >
      <form
        id="timetable-entry-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {/* Class combobox */}
        <div ref={wrapperRef} className="relative">
          <label
            htmlFor="timetable-class"
            className="block text-xs font-bold text-navy-950"
          >
            Class
          </label>

          {isLoadingCourses ? (
            <div className="mt-2 flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <svg className="h-4 w-4 animate-spin text-purple-500" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                <path d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" fill="currentColor" />
              </svg>
            </div>
          ) : (
            <>
              {/* Input with icon */}
              <div className="relative mt-2">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="timetable-class"
                  autoComplete="off"
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => setOpen_(true)}
                  disabled={isEdit}
                  placeholder="Type or pick a class…"
                  className={`h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
                    errors.class_course_id ? "border-coral-300" : ""
                  }`}
                />
                {query && !isEdit && (
                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear"
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-950"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Suggestions dropdown */}
              {open_ && !isEdit && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-elevated-lg">
                  {matches.length > 0 && (
                    <>
                      <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Existing classes
                      </p>
                      {matches.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => handlePickCourse(course)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                            <BookOpen size={13} strokeWidth={2.2} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-navy-950">
                              {course.name}
                            </p>
                            {course.subject && (
                              <p className="truncate text-[10px] text-slate-400">
                                {course.subject}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {query.trim() && !exactMatch && (
                    <>
                      {matches.length > 0 && (
                        <div className="my-1 h-px bg-slate-100" />
                      )}
                      <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Create new
                      </p>
                      <div className="flex items-center gap-3 px-3 py-2 text-xs text-slate-500">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Plus size={13} strokeWidth={2.5} />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          A new class{" "}
                          <span className="font-bold text-navy-950">
                            &ldquo;{query.trim()}&rdquo;
                          </span>{" "}
                          will be created and added to your classes list.
                        </span>
                      </div>
                    </>
                  )}

                  {!query.trim() && matches.length === 0 && (
                    <p className="px-3 py-3 text-center text-xs text-slate-400">
                      No classes yet — type a name to create one.
                    </p>
                  )}
                </div>
              )}

              {isEdit && (
                <p className="mt-1.5 text-xs text-slate-400">
                  The class cannot be changed after the entry is created.
                </p>
              )}
            </>
          )}

          {errors.class_course_id?.[0] && (
            <p className="mt-1.5 text-xs font-semibold text-coral-600">
              {errors.class_course_id[0]}
            </p>
          )}
        </div>

        {/* Day */}
        <div>
          <label
            htmlFor="timetable-day"
            className="block text-xs font-bold text-navy-950"
          >
            Day
          </label>
          <select
            id="timetable-day"
            value={form.day_of_week}
            onChange={handleChange("day_of_week")}
            className="mt-2 h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy-950 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Times */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Start time"
            type="time"
            value={form.start_time}
            onChange={handleChange("start_time")}
            error={errors.start_time?.[0]}
            required
          />
          <Input
            label="End time"
            type="time"
            value={form.end_time}
            onChange={handleChange("end_time")}
            error={errors.end_time?.[0]}
            required
          />
        </div>

        {/* Room */}
        <Input
          label="Room / location (optional)"
          value={form.room}
          onChange={handleChange("room")}
          placeholder="e.g. R101"
        />

        {formError && (
          <p
            role="alert"
            className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-sm font-semibold text-coral-600"
          >
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}