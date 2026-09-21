// In-memory store for Notification mock data. Shape mirrors a future
// backend/notifications/models.py Notification model. Handlers read/write
// this module; components never see it directly.
//
// `target` is a small object describing where clicking the notification
// should navigate. Keeping it structured (rather than a raw URL string)
// means the panel doesn't need to know each feature's route shape.
//
// Cross-tab persistence: the seed array below is only the fallback. On
// first load (or after localStorage is cleared), the seed is used. After
// any write, state is persisted to localStorage and a change ping is
// broadcast to other tabs of the same browser. See ../crossTabSync.js.

import { findUserById } from "./users";
import {
  loadFromStorage,
  persistToStorage,
  broadcastChangeSoon,
} from "../crossTabSync";

// Seeded demo notifications used to live here. They are intentionally gone:
// every notification in the system now originates from a real action --
// a chat message, a material upload, an announcement, or a quiz publish.
// On a fresh install the list is empty.
//
// The IDs below are the only thing that survives, purely to identify and
// purge any stale seed entries that were persisted to localStorage by a
// previous version of the app. Once purged from every client, this list
// can be deleted.
const LEGACY_SEED_IDS = new Set([
  "notif-seed-1",
  "notif-seed-2",
  "notif-seed-3",
  "notif-seed-4",
  "notif-seed-5",
]);

const storedNotifications = loadFromStorage("notifications", []);
const cleanedNotifications = storedNotifications.filter(
  (n) => !LEGACY_SEED_IDS.has(n.id)
);
if (cleanedNotifications.length !== storedNotifications.length) {
  // A previous version's seed was found and dropped. Write the cleaned
  // array back so the purge is permanent.
  persistToStorage("notifications", cleanedNotifications);
}
let notifications = cleanedNotifications;

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
  if (!notif.read_at) {
    notif.read_at = new Date().toISOString();
    persistToStorage("notifications", notifications);
    broadcastChangeSoon("notifications.markRead");
  }
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
  if (count > 0) {
    persistToStorage("notifications", notifications);
    broadcastChangeSoon("notifications.markAllRead");
  }
  return count;
}

// Notification creation flows through one place, with one ID format and
// one timestamp source.
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
  persistToStorage("notifications", notifications);
  broadcastChangeSoon("notifications.add");
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

