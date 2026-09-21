// Cross-tab synchronization for the mock data layer.
//
// Every write to the mock data modules (chat messages, notifications, etc.)
// funnels through this module so that:
//   1. State is persisted to localStorage, surviving page refreshes.
//   2. Other tabs of the same origin are notified, so a message sent in
//      tab A appears in tab B without either tab refetching from a server.
//
// Scope: this is still a frontend-only mock. Two tabs on the same browser
// share state. Two different machines do not. That's the intended boundary
// until a real backend replaces the mock dispatcher.
//
// Persistence format: each store is written under its own localStorage key
// as a JSON blob. On load, if the key is missing, the caller's seed value
// is used instead -- so the app boots with the same demo data as before
// the first time it runs.

const CHANNEL_NAME = "learn-smart-sync";
const STORAGE_PREFIX = "learn-smart.mock.";

// A single BroadcastChannel shared by every store. Messages are tiny --
// just a "something changed" ping -- because localStorage is the actual
// transport. The channel is a wake-up signal, nothing more.
let channel = null;

function getChannel() {
  if (typeof window === "undefined") return null;
  if (channel) return channel;
  if (typeof BroadcastChannel === "undefined") return null;
  channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

// -------- storage -------------------------------------------------------

export function loadFromStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    // Corrupt entry -- fall back to the seed rather than crashing the app.
    return fallback;
  }
}

export function persistToStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded / private mode / disabled storage: silently skip.
    // The app keeps working in-memory, just without persistence.
  }
}

export function clearMockStorage() {
  if (typeof window === "undefined") return;
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// -------- change notification ------------------------------------------

// Called by a data module after it mutates its in-memory state AND writes
// to localStorage. Broadcasts a ping to every other tab. `source` is used
// only for debugging; subscribers don't need to inspect it.
export function broadcastChange(source) {
  const ch = getChannel();
  if (!ch) return;
  try {
    ch.postMessage({ type: "mock:changed", source, at: Date.now() });
  } catch {
    // Channel closed or environment doesn't support postMessage -- ignore.
  }
}

// Subscribe to change pings from OTHER tabs. Returns an unsubscribe
// function. Does not fire for pings sent by this tab.
export function subscribeToChanges(callback) {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = (event) => {
    if (!event || !event.data) return;
    if (event.data.type !== "mock:changed") return;
    callback(event.data);
  };
  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}

// Convenience: fire a change ping on the next tick, to give localStorage
// a chance to finish writing before subscribers read it back.
export function broadcastChangeSoon(source) {
  setTimeout(() => broadcastChange(source), 0);
}
