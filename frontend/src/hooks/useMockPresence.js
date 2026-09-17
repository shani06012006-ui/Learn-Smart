import { useEffect, useState } from "react";

/**
 * Stands in for the real presence WebSocket (accounts/consumers.py on the
 * backend) until that's wired up on the frontend. Takes the roster's
 * actual `is_online` values as a starting point, then flips a random
 * subset every few seconds so the UI's online/offline badges visibly
 * update -- proving out the badge component and layout before real-time
 * data exists.
 *
 * Swap-out plan: replace this hook's body with a `useWebSocket('/ws/presence/')`
 * subscription that dispatches the same { [userId]: boolean } shape; every
 * component using this hook (OnlineStatusBadge, roster tables) stays unchanged.
 */
export function useMockPresence(userIds, initialStatus = {}) {
  const [presence, setPresence] = useState(initialStatus);

  useEffect(() => {
    const interval = setInterval(() => {
      setPresence((prev) => {
        if (userIds.length === 0) return prev;
        const next = { ...prev };
        // Flip one random user's status each tick -- gradual, believable
        // changes rather than the whole roster flickering at once.
        const target = userIds[Math.floor(Math.random() * userIds.length)];
        next[target] = !next[target];
        return next;
      });
    }, 6000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds.join(",")]);

  return presence; // { [userId]: boolean }
}
