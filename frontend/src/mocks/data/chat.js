// In-memory store for ChatThread + ChatMessage mock data. Shapes mirror the
// future backend/chat/models.py models. Handlers read/write this module;
// components never see it directly.

import { findUserById } from "./users";
import { findClassById, classesForStudent, classesForTeacher } from "./classes";

// Threads are either:
//   - kind: "direct"  -> two participants (teacher + student)
//   - kind: "group"   -> one class's teacher + all active students
// The frontend never constructs a thread; it fetches whichever threads the
// current user is a member of.
let threads = [
  {
    id: "thread-anita-rahul",
    kind: "direct",
    participant_ids: ["usr-teacher-anita", "usr-student-rahul"],
    class_id: null,
    created_at: "2026-08-15T09:00:00+05:30",
  },
  {
    id: "thread-anita-meera",
    kind: "direct",
    participant_ids: ["usr-teacher-anita", "usr-student-meera"],
    class_id: null,
    created_at: "2026-08-15T09:05:00+05:30",
  },
  {
    id: "thread-anita-arjun",
    kind: "direct",
    participant_ids: ["usr-teacher-anita", "usr-student-arjun"],
    class_id: null,
    created_at: "2026-08-16T10:00:00+05:30",
  },
  {
    id: "thread-phy10-group",
    kind: "group",
    participant_ids: [], // computed dynamically from the class roster
    class_id: "cls-phy10-anita",
    created_at: "2026-08-12T09:30:00+05:30",
  },
];

// Messages: each row has a sender and a body. `read_by_ids` tracks who has
// seen the message -- used to compute unread counts per user.
let messages = [
  // --- Anita <-> Rahul ---
  {
    id: "msg-a-r-1",
    thread_id: "thread-anita-rahul",
    sender_id: "usr-teacher-anita",
    body: "Hi Rahul, I noticed your last quiz score dropped. Do you want to go over projectile motion together?",
    created_at: "2026-09-10T14:20:00+05:30",
    read_by_ids: ["usr-teacher-anita", "usr-student-rahul"],
  },
  {
    id: "msg-a-r-2",
    thread_id: "thread-anita-rahul",
    sender_id: "usr-student-rahul",
    body: "Yes ma'am, please. I'm confused about how to break velocity into components.",
    created_at: "2026-09-10T14:35:00+05:30",
    read_by_ids: ["usr-teacher-anita", "usr-student-rahul"],
  },
  {
    id: "msg-a-r-3",
    thread_id: "thread-anita-rahul",
    sender_id: "usr-teacher-anita",
    body: "No problem. Bring your notebook tomorrow — we'll work through a few examples.",
    created_at: "2026-09-10T14:41:00+05:30",
    read_by_ids: ["usr-teacher-anita"], // Rahul hasn't read this yet
  },

  // --- Anita <-> Meera ---
  {
    id: "msg-a-m-1",
    thread_id: "thread-anita-meera",
    sender_id: "usr-student-meera",
    body: "Ma'am, is the Chemistry quiz on Friday or Monday?",
    created_at: "2026-09-11T09:15:00+05:30",
    read_by_ids: ["usr-student-meera"], // Anita hasn't read this yet
  },

  // --- Anita <-> Arjun ---
  {
    id: "msg-a-a-1",
    thread_id: "thread-anita-arjun",
    sender_id: "usr-teacher-anita",
    body: "Arjun, please submit your quiz 3. It's overdue.",
    created_at: "2026-09-09T11:00:00+05:30",
    read_by_ids: ["usr-teacher-anita"], // Arjun hasn't read this yet
  },

  // --- Physics group ---
  {
    id: "msg-phy-1",
    thread_id: "thread-phy10-group",
    sender_id: "usr-teacher-anita",
    body: "Reminder: bring scientific calculators to the quiz on Friday.",
    created_at: "2026-09-12T08:00:00+05:30",
    read_by_ids: ["usr-teacher-anita", "usr-student-rahul", "usr-student-meera"],
  },
];

// ---------- reads ---------------------------------------------------------

// Threads the user belongs to. For group threads, membership is derived from
// the class roster: teacher of the class + active students in the class.
export function threadsForUser(userId) {
  const user = findUserById(userId);
  if (!user) return [];

  return threads.filter((t) => {
    if (t.kind === "direct") {
      return t.participant_ids.includes(userId);
    }
    if (t.kind === "group") {
      const cls = findClassById(t.class_id);
      if (!cls) return false;
      if (cls.teacher_id === userId) return true;
      // Student is a member if they have an active enrollment in the class.
      return classesForStudent(userId).some((c) => c.id === cls.id);
    }
    return false;
  });
}

export function findThreadById(id) {
  return threads.find((t) => t.id === id);
}

export function messagesForThread(threadId) {
  return messages
    .filter((m) => m.thread_id === threadId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

// Access check: can `userId` see this thread?
export function canAccessThread(threadId, userId) {
  const thread = findThreadById(threadId);
  if (!thread) return false;
  return threadsForUser(userId).some((t) => t.id === threadId);
}

// Unread count for the given user: messages NOT sent by them and NOT in
// their read_by_ids.
export function unreadCountForUser(threadId, userId) {
  return messages.filter(
    (m) =>
      m.thread_id === threadId &&
      m.sender_id !== userId &&
      !m.read_by_ids.includes(userId)
  ).length;
}

// Last message in the thread, used for the thread-list preview.
export function lastMessageForThread(threadId) {
  const list = messagesForThread(threadId);
  return list.length > 0 ? list[list.length - 1] : null;
}

// ---------- writes --------------------------------------------------------

export function appendMessage({ threadId, senderId, body }) {
  const message = {
    id: `msg-${Math.random().toString(36).slice(2, 10)}`,
    thread_id: threadId,
    sender_id: senderId,
    body,
    created_at: new Date().toISOString(),
    read_by_ids: [senderId],
  };
  messages.push(message);
  return message;
}

// Mark every message in a thread as read by the given user.
export function markThreadRead(threadId, userId) {
  let changed = 0;
  messages.forEach((m) => {
    if (m.thread_id === threadId && !m.read_by_ids.includes(userId)) {
      m.read_by_ids.push(userId);
      changed += 1;
    }
  });
  return changed;
}

// ---------- serializers ---------------------------------------------------

// Human-readable thread title from the perspective of `viewerId`.
//   direct: the OTHER participant's name
//   group:  the class name + " — Class Chat"
export function threadTitleForViewer(thread, viewerId) {
  if (thread.kind === "group") {
    const cls = findClassById(thread.class_id);
    return cls ? `${cls.name} — Class Chat` : "Class Chat";
  }
  const otherId = thread.participant_ids.find((id) => id !== viewerId);
  const other = otherId ? findUserById(otherId) : null;
  return other?.full_name || "Unknown";
}

// Avatar initials: first letters of the first two name parts.
export function initialsFor(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function serializeThread(thread, viewerId) {
  const last = lastMessageForThread(thread.id);
  const lastSender = last ? findUserById(last.sender_id) : null;

  return {
    id: thread.id,
    kind: thread.kind,
    class_id: thread.class_id,
    title: threadTitleForViewer(thread, viewerId),
    initials: initialsFor(threadTitleForViewer(thread, viewerId)),
    participant_count:
      thread.kind === "group"
        ? countGroupParticipants(thread)
        : thread.participant_ids.length,
    last_message: last
      ? {
          id: last.id,
          body: last.body,
          sender_id: last.sender_id,
          sender_name: lastSender?.full_name || "Unknown",
          created_at: last.created_at,
        }
      : null,
    unread_count: unreadCountForUser(thread.id, viewerId),
  };
}

function countGroupParticipants(thread) {
  const cls = findClassById(thread.class_id);
  if (!cls) return 0;
  // Teacher + active students. (Uses classesForTeacher so we don't have to
  // expose enrollment internals from data/classes.js.)
  const enrolled = studentsInClass(cls.id);
  return enrolled.length + 1; // +1 for the teacher
}

// Local helper: since data/classes.js doesn't export an "all enrollments in
// class" reader, we compute it from classesForStudent for each student in
// data/users.js. Small N (3 seeded students) — fine for a mock.
import { users as allUsers } from "./users";
function studentsInClass(classId) {
  return allUsers.filter(
    (u) =>
      u.role === "student" &&
      classesForStudent(u.id).some((c) => c.id === classId)
  );
}

export function serializeMessage(message) {
  const sender = findUserById(message.sender_id);
  return {
    id: message.id,
    thread_id: message.thread_id,
    sender_id: message.sender_id,
    sender_name: sender?.full_name || "Unknown",
    sender_initials: initialsFor(sender?.full_name),
    body: message.body,
    created_at: message.created_at,
  };
}

// Seed: used to compute what a "brand new user" would see. Empty threads /
// empty messages. Included so the handler can return a well-shaped empty
// response rather than 404 for a user with no conversations.
export function emptyThreadList() {
  return [];
}
