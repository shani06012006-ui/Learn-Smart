/**
 * useCrossTabSync -- DISABLED.
 *
 * This hook originally sync'd the mock data layer across browser tabs
 * via BroadcastChannel + localStorage. It invalidated a broad set of
 * RTK Query tags on every cross-tab event, which caused:
 *
 *   - Cross-session cache invalidation (admin tags firing on teacher
 *     pages, producing spurious 403s in the server log)
 *   - WS reconnect storms (the chat socket was torn down and re-opened
 *     every ~60 seconds because cached queries kept refetching)
 *
 * With the app now on the real backend, WebSockets provide the cross-tab
 * transport we actually need. This hook is intentionally a no-op so any
 * remaining import site does not break, but it does nothing.
 *
 * If a future feature needs true cross-tab sync of *real* data, wire it
 * against the WebSocket layer -- do not resurrect the mock path.
 */
export function useCrossTabSync() {
  // Intentionally empty.
}
