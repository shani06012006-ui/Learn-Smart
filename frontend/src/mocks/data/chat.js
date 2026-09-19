// In-memory store for ChatThread + ChatMessage mock data. Shapes mirror the
// future backend/chat/models.py models. Handlers read/write this module;
// components never see it directly.

import { findUserById, users as allUsers } from "./users";
import { findClassById, classesForStudent } from "./classes";
import { addNotification } from "./notifications";

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
    participant_ids: [],
    class_id: "cls-phy10-anita",
    created_at: "2026-08-12T09:30:00+05:30",
  },
];

let messages = [
  {
    id: "msg-a-r-1",
    thread_id: "thread-anita-rahul",
    sender_id: "usr-teacher-anita",
    body: "Hi Rahul, I noticed your last quiz score dropped. Do you want to go over projectile motion together?",
    created_at: "2026-09-10T14:20:00+05:30",
    read_by_ids: ["usr-teacher-anita", "usr-student-rahul"],
    deleted: false,
  },
  {
    id: "msg-a-r-2",
    thread_id: "thread-anita-rahul",
    sender_id: "usr-student-rahul",
    body: "Yes ma'am, please. I'm confused about how to break velocity into components.",
    created_at: "2026-09-10T14:35:00+05:30",
    read_by_ids: ["usr-teacher-anita", "usr-student-rahul"],
    deleted: false,
  },
  {
    id: "msg-a-r-3",
    thread_id: "thread-anita-rahul",
    sender_id: "usr-teacher-anita",
    body: "No problem. Bring your notebook tomorrow — we'll work through a few examples.",
    created_at: "2026-09-10T14:41:00+05:30",
    read_by_ids: ["usr-teacher-anita"],
    deleted: false,
  },
  {
    id: "msg-a-r-4",
    thread_id: "thread-anita-rahul",
    sender_id: "usr-student-rahul",
    body: "Thank you ma'am! See you tomorrow.",
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    read_by_ids: ["usr-student-rahul"],
    deleted: false,
  },
  {
    id: "msg-a-m-1",
    thread_id: "thread-anita-meera",
    sender_id: "usr-student-meera",
    body: "Ma'am, is the Chemistry quiz on Friday or Monday?",
    created_at: "2026-09-11T09:15:00+05:30",
    read_by_ids: ["usr-student-meera"],
    deleted: false,
  },
  {
    id: "msg-a-a-1",
    thread_id: "thread-anita-arjun",
    sender_id: "usr-teacher-anita",
    body: "Arjun, please submit your quiz 3. It's overdue.",
    created_at: "2026-09-09T11:00:00+05:30",
    read_by_ids: ["usr-teacher-anita"],
    deleted: false,
  },
  {
    id: "msg-phy-1",
    thread_id: "thread-phy10-group",
    sender_id: "usr-teacher-anita",
    body: "Reminder: bring scientific calculators to the quiz on Friday.",
    created_at: "2026-09-12T08:00:00+05:30",
    read_by_ids: ["usr-teacher-anita", "usr-student-rahul", "usr-student-meera"],
    deleted: false,
  },
];

// ---------- reads ---------------------------------------------------------

export function threadsForUser(userId) {
  const user = findUserById(userId);
  if (!user) return [];
  return threads.filter((t) => {
    if (t.kind === "direct") return t.participant_ids.includes(userId);
    if (t.kind === "group") {
      const cls = findClassById(t.class_id);
      if (!cls) return false;
      if (cls.teacher_id === userId) return true;
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
    .filter((m) => m.thread_id === threadId && !m.deleted)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export function canAccessThread(threadId, userId) {
  const thread = findThreadById(threadId);
  if (!thread) return false;
  return threadsForUser(userId).some((t) => t.id === threadId);
}

export function unreadCountForUser(threadId, userId) {
  return messages.filter(
    (m) =>
      m.thread_id === threadId &&
      !m.deleted &&
      m.sender_id !== userId &&
      !m.read_by_ids.includes(userId)
  ).length;
}

export function lastMessageForThread(threadId) {
  const list = messagesForThread(threadId);
  return list.length > 0 ? list[list.length - 1] : null;
}

export function readByOthers(message) {
  const thread = findThreadById(message.thread_id);
  if (!thread) return false;
  let otherIds = [];
  if (thread.kind === "direct") {
    otherIds = thread.participant_ids.filter((id) => id !== message.sender_id);
  } else if (thread.kind === "group") {
    const cls = findClassById(thread.class_id);
    if (!cls) return false;
    otherIds = [cls.teacher_id, ...studentsInClass(cls.id)].filter(
      (id) => id !== message.sender_id
    );
  }
  if (otherIds.length === 0) return false;
  return otherIds.every((id) => message.read_by_ids.includes(id));
}

export function participantIdsForThread(thread) {
  if (thread.kind === "direct") return [...thread.participant_ids];
  if (thread.kind === "group") {
    const cls = findClassById(thread.class_id);
    if (!cls) return [];
    return [cls.teacher_id, ...studentsInClass(cls.id).map((u) => u.id)];
  }
  return [];
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
    deleted: false,
  };
  messages.push(message);

  // Fan out a notification to each recipient (everyone else in the thread).
  const thread = findThreadById(threadId);
  if (thread) {
    const sender = findUserById(senderId);
    const recipientIds = participantIdsForThread(thread).filter(
      (id) => id !== senderId
    );
    recipientIds.forEach((recipientId) => {
      addNotification({
        kind: "chat_message",
        recipientId,
        senderId,
        title: `New message from ${sender?.full_name || "someone"}`,
        body: String(body).slice(0, 140),
        target: { kind: "chat_thread", thread_id: threadId },
      });
    });
  }

  return message;
}

export function markThreadRead(threadId, userId) {
  let changed = 0;
  messages.forEach((m) => {
    if (m.thread_id === threadId && !m.deleted && !m.read_by_ids.includes(userId)) {
      m.read_by_ids.push(userId);
      changed += 1;
    }
  });
  return changed;
}

export function deleteMessage(messageId, userId) {
  const message = messages.find((m) => m.id === messageId);
  if (!message) return { ok: false, reason: "not_found" };
  if (message.sender_id !== userId) return { ok: false, reason: "not_owner" };
  if (message.deleted) return { ok: false, reason: "already_deleted" };
  message.deleted = true;
  return { ok: true, message };
}

// ---------- serializers ---------------------------------------------------

export function threadTitleForViewer(thread, viewerId) {
  if (thread.kind === "group") {
    const cls = findClassById(thread.class_id);
    return cls ? `${cls.name} — Class Chat` : "Class Chat";
  }
  const otherId = thread.participant_ids.find((id) => id !== viewerId);
  const other = otherId ? findUserById(otherId) : null;
  return other?.full_name || "Unknown";
}

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
  const participantCount = participantIdsForThread(thread).length;

  return {
    id: thread.id,
    kind: thread.kind,
    class_id: thread.class_id,
    title: threadTitleForViewer(thread, viewerId),
    initials: initialsFor(threadTitleForViewer(thread, viewerId)),
    participant_count: participantCount,
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

function studentsInClass(classId) {
  return allUsers.filter(
    (u) =>
      u.role === "student" &&
      classesForStudent(u.id).some((c) => c.id === classId)
  );
}

// Presence for a user. Reads `is_online` from data/users.js; when offline,
// fabricates a deterministic "last seen" timestamp in the recent past so the
// UI has something subtle to show. Real presence (WebSocket) is a future
// module -- this is a UI placeholder.
function presenceFor(user) {
  if (user?.is_online) {
    return { is_online: true, last_seen: null };
  }
  // Deterministic offset from the user id so the same user always shows the
  // same "last seen" value during a session.
  let seed = 0;
  for (let i = 0; i < (user?.id || "").length; i++) {
    seed = (seed << 5) - seed + user.id.charCodeAt(i);
    seed |= 0;
  }
  const hoursAgo = 1 + (Math.abs(seed) % 24);
  const lastSeen = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  return { is_online: false, last_seen: lastSeen };
}

// Shared helper for building a member row from a user record.
function serializeMember(u, viewer, classDoc) {
  const isSelf = u.id === viewer?.id;
  const isTeacherOfClass = classDoc && classDoc.teacher_id === u.id;

  let email;
  if (isSelf) {
    email = u.email;
  } else if (viewer?.role === "teacher") {
    email = u.email;
  } else if (viewer?.role === "student" && u.role === "teacher") {
    email = u.email;
  } else {
    email = undefined;
  }

  const classNames =
    u.role === "student"
      ? classesForStudent(u.id).map((c) => c.name)
      : classDoc
      ? [classDoc.name]
      : [];

  return {
    id: u.id,
    full_name: u.full_name,
    initials: initialsFor(u.full_name),
    role: u.role,
    thread_role: isTeacherOfClass
      ? "Teacher"
      : u.role === "student"
      ? "Class member"
      : u.role,
    email,
    class_names: classNames,
    is_self: isSelf,
    presence: presenceFor(u),
  };
}

export function serializeThreadMembers(threadId, viewerId) {
  const thread = findThreadById(threadId);
  if (!thread) return [];

  const viewer = findUserById(viewerId);
  const participantIds = participantIdsForThread(thread);
  const isGroup = thread.kind === "group";
  const classDoc = isGroup ? findClassById(thread.class_id) : null;

  return participantIds
    .map((uid) => findUserById(uid))
    .filter(Boolean)
    .map((u) => serializeMember(u, viewer, classDoc));
}

// Single member profile lookup for a specific (thread, user). Returns null if
// the user is not a participant of the thread -- the caller (dispatcher)
// translates that into a 404. This is the ONLY way to fetch a user's profile:
// via a thread the viewer already has access to.
export function serializeThreadMember(threadId, userId, viewerId) {
  const thread = findThreadById(threadId);
  if (!thread) return null;

  const viewer = findUserById(viewerId);
  const participantIds = participantIdsForThread(thread);
  if (!participantIds.includes(userId)) return null;

  const target = findUserById(userId);
  if (!target) return null;

  const isGroup = thread.kind === "group";
  const classDoc = isGroup ? findClassById(thread.class_id) : null;

  return serializeMember(target, viewer, classDoc);
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
    read_by_others: readByOthers(message),
    read_by_ids: [...message.read_by_ids],
    deleted: !!message.deleted,
  };
}

export function emptyThreadList() {
  return [];
}

