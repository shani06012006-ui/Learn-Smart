// In-memory store for LiveClass mock data. Shapes mirror a future
// backend/live_classes/models.py LiveClass model. Handlers read/write this
// module; components never see it directly.
//
// A LiveClass belongs to one class (class_id). Teacher is derived from the
// class's owner. Students who are actively enrolled in that class see the
// live class; nobody else does.
//
// Status is computed from start_time + duration_minutes rather than stored,
// so the same record transitions through scheduled → live → past without a
// background job.

import { findClassById, classesForStudent } from "./classes";
import { findUserById, users as allUsers } from "./users";
import { addNotification } from "./notifications";

// ---------- seed data -----------------------------------------------------

let liveClasses = [
  {
    id: "lc-phy10-1",
    class_id: "cls-phy10-anita",
    title: "Newton's Laws — Problem Solving",
    description:
      "We'll work through projectile motion and free-body diagrams together. Bring your questions.",
    start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // ~3h from now
    duration_minutes: 45,
    meeting_url: "https://meet.example.com/phy10-newton",
    created_by_id: "usr-teacher-anita",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    is_cancelled: false,
    is_deleted: false,
  },
  {
    id: "lc-phy10-2",
    class_id: "cls-phy10-anita",
    title: "Mid-term Revision",
    description: "Covering all topics from Chapter 1–4 before the mid-term.",
    start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    duration_minutes: 60,
    meeting_url: "https://meet.example.com/phy10-revision",
    created_by_id: "usr-teacher-anita",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_cancelled: false,
    is_deleted: false,
  },
  {
    id: "lc-chem10-1",
    class_id: "cls-chem10-anita",
    title: "Lab Safety Walkthrough",
    description: "Before Monday's practical — what to wear, what to expect.",
    start_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    duration_minutes: 30,
    meeting_url: "",
    created_by_id: "usr-teacher-anita",
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    is_cancelled: false,
    is_deleted: false,
  },
];

// ---------- reads ---------------------------------------------------------

export function findLiveClassById(id) {
  return liveClasses.find((l) => l.id === id && !l.is_deleted);
}

// Live classes for a class — used by teachers (own class) and students
// (enrolled class). Callers must already have verified access to the class.
export function liveClassesForClass(classId) {
  return liveClasses
    .filter((l) => l.class_id === classId && !l.is_deleted)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

// Every live class across a teacher's own classes.
export function liveClassesForTeacher(teacherId) {
  const list = liveClasses.filter((l) => !l.is_deleted);
  return list
    .filter((l) => {
      const cls = findClassById(l.class_id);
      return cls && cls.teacher_id === teacherId;
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

// Every live class across a student's actively-enrolled classes.
export function liveClassesForStudent(studentId) {
  const classIds = classesForStudent(studentId).map((c) => c.id);
  return liveClasses
    .filter((l) => classIds.includes(l.class_id) && !l.is_deleted)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

// ---------- writes --------------------------------------------------------

export function addLiveClass({
  classId,
  title,
  description,
  startTime,
  durationMinutes,
  meetingUrl,
  createdById,
}) {
  const liveClass = {
    id: `lc-${Math.random().toString(36).slice(2, 10)}`,
    class_id: classId,
    title,
    description: description || "",
    start_time: startTime,
    duration_minutes: durationMinutes,
    meeting_url: meetingUrl || "",
    created_by_id: createdById,
    created_at: new Date().toISOString(),
    is_cancelled: false,
    is_deleted: false,
  };
  liveClasses.push(liveClass);

  // Notify every active student in the class (skip the teacher).
  const teacher = findUserById(createdById);
  const recipients = allUsers.filter(
    (u) =>
      u.role === "student" &&
      u.id !== createdById &&
      classesForStudent(u.id).some((c) => c.id === classId)
  );
  recipients.forEach((student) => {
    addNotification({
      kind: "live_class",
      recipientId: student.id,
      senderId: createdById,
      title: "New live class scheduled",
      body: `${title} — scheduled by ${teacher?.full_name || "your teacher"}`,
      target: { kind: "live_class", live_class_id: liveClass.id, class_id: classId },
    });
  });

  return liveClass;
}

export function updateLiveClass(id, patch) {
  const liveClass = liveClasses.find((l) => l.id === id);
  if (!liveClass) return null;
  Object.assign(liveClass, patch);
  return liveClass;
}

export function cancelLiveClass(id) {
  const liveClass = liveClasses.find((l) => l.id === id);
  if (!liveClass) return null;
  liveClass.is_cancelled = true;
  return liveClass;
}

export function softDeleteLiveClass(id) {
  const liveClass = liveClasses.find((l) => l.id === id);
  if (!liveClass) return false;
  liveClass.is_deleted = true;
  return true;
}

// ---------- status + serializer -------------------------------------------

// Status is derived. Returns one of:
//   "cancelled" | "live" | "past" | "upcoming"
// Priority: cancelled > live > past > upcoming.
export function computeStatus(liveClass) {
  if (liveClass.is_cancelled) return "cancelled";
  const now = Date.now();
  const start = new Date(liveClass.start_time).getTime();
  const end = start + (liveClass.duration_minutes || 0) * 60 * 1000;
  if (now >= start && now <= end) return "live";
  if (now > end) return "past";
  return "upcoming";
}

export function serializeLiveClass(liveClass) {
  const cls = findClassById(liveClass.class_id);
  const teacher = findUserById(liveClass.created_by_id);
  return {
    id: liveClass.id,
    class_id: liveClass.class_id,
    class_name: cls?.name || "",
    class_subject: cls?.subject || "",
    teacher_id: teacher?.id || "",
    teacher_name: teacher?.full_name || "Your teacher",
    teacher_initials: teacher
      ? teacher.full_name
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0])
          .join("")
          .toUpperCase()
      : "?",
    title: liveClass.title,
    description: liveClass.description,
    start_time: liveClass.start_time,
    duration_minutes: liveClass.duration_minutes,
    meeting_url: liveClass.meeting_url,
    status: computeStatus(liveClass),
    is_cancelled: liveClass.is_cancelled,
    created_at: liveClass.created_at,
  };
}
