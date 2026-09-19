// In-memory store for Notification mock data. Shape mirrors a future
// backend/notifications/models.py Notification model. Handlers read/write
// this module; components never see it directly.
//
// `target` is a small object describing where clicking the notification
// should navigate. Keeping it structured (rather than a raw URL string)
// means the panel doesn't need to know each feature's route shape.

import { findUserById } from "./users";

// Seed notifications. These exist so the bell has something to show on
// first load. Batch 3 will make notifications appear as a side-effect of
// real actions (sending a chat message, uploading a material, etc.).
let notifications = [
  {
    id: "notif-seed-1",
    kind: "chat_message",
    recipient_id: "usr-student-rahul",
    sender_id: "usr-teacher-anita",
    title: "New message from Anita Iyer",
    body: "No problem. Bring your notebook tomorrow — we'll work through a few examples.",
    target: { kind: "chat_thread", thread_id: "thread-anita-rahul" },
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    read_at: null,
  },
  {
    id: "notif-seed-2",
    kind: "announcement",
    recipient_id: "usr-student-rahul",
    sender_id: "usr-teacher-anita",
    title: "New announcement in Grade 10 Physics",
    body: "Quiz on Newton's Laws — Friday. The quiz will cover Chapter 4.",
    target: { kind: "announcement", class_id: "cls-phy10-anita" },
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read_at: null,
  },
  {
    id: "notif-seed-3",
    kind: "material",
    recipient_id: "usr-student-rahul",
    sender_id: "usr-teacher-anita",
    title: "New material in Grade 10 Physics",
    body: "Motion Practice Problems — 20 practice problems for the upcoming quiz.",
    target: { kind: "material", class_id: "cls-phy10-anita" },
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    read_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-seed-4",
    kind: "chat_message",
    recipient_id: "usr-teacher-anita",
    sender_id: "usr-student-meera",
    title: "New message from Meera Nair",
    body: "Ma'am, is the Chemistry quiz on Friday or Monday?",
    target: { kind: "chat_thread", thread_id: "thread-anita-meera" },
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read_at: null,
  },
  {
    id: "notif-seed-5",
    kind: "quiz_published",
    recipient_id: "usr-student-rahul",
    sender_id: "usr-teacher-anita",
    title: "New quiz published in Grade 10 Physics",
    body: "Newton's Laws — Quiz 4 is now open.",
    target: {
      kind: "quiz",
      class_id: "cls-phy10-anita",
      quiz_id: "quiz-phy10-2",
    },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ---------- reads ---------------------------------------------------------

export function notificationsForUser(userId) {
  return notifications
    .filter((n) => n.recipient_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function unreadCountForUser(userId) {
  return notifications.filter(
    (n) => n.recipient_id === userId && !n.read_at
  ).length;
}

export function findNotificationById(id) {
  return notifications.find((n) => n.id === id);
}

// ---------- writes --------------------------------------------------------

export function markNotificationRead(id, userId) {
  const notif = notifications.find((n) => n.id === id);
  if (!notif) return { ok: false, reason: "not_found" };
  if (notif.recipient_id !== userId) return { ok: false, reason: "not_owner" };
  if (!notif.read_at) notif.read_at = new Date().toISOString();
  return { ok: true, notification: notif };
}

export function markAllNotificationsRead(userId) {
  const now = new Date().toISOString();
  let count = 0;
  notifications.forEach((n) => {
    if (n.recipient_id === userId && !n.read_at) {
      n.read_at = now;
      count += 1;
    }
  });
  return count;
}

// Batch 3 will call this from addMessage / addMaterial / addAnnouncement /
// publishQuiz. Kept here so all notification creation flows through one
// place, with one ID format and one timestamp source.
export function addNotification({ kind, recipientId, senderId, title, body, target }) {
  const notification = {
    id: `notif-${Math.random().toString(36).slice(2, 10)}`,
    kind,
    recipient_id: recipientId,
    sender_id: senderId,
    title,
    body,
    target,
    created_at: new Date().toISOString(),
    read_at: null,
  };
  notifications.push(notification);
  return notification;
}

// ---------- serializer ----------------------------------------------------

export function serializeNotification(notification) {
  const sender = findUserById(notification.sender_id);
  return {
    id: notification.id,
    kind: notification.kind,
    recipient_id: notification.recipient_id,
    sender_id: notification.sender_id,
    sender_name: sender?.full_name || "Unknown",
    sender_initials: sender
      ? sender.full_name
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0])
          .join("")
          .toUpperCase()
      : "?",
    title: notification.title,
    body: notification.body,
    target: notification.target,
    created_at: notification.created_at,
    read_at: notification.read_at,
  };
}
