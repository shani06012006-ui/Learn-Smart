// Deterministic background color for a user's initials avatar, based on a
// stable hash of their id. Picked from a curated Tailwind palette so the
// colors read well against white text.
const PALETTE = [
  { bg: "bg-brand-500", text: "text-white" },
  { bg: "bg-success-500", text: "text-white" },
  { bg: "bg-warning-500", text: "text-white" },
  { bg: "bg-danger-500", text: "text-white" },
  { bg: "bg-ink-700", text: "text-white" },
  { bg: "bg-brand-700", text: "text-white" },
  { bg: "bg-success-700", text: "text-white" },
];

export function avatarColor(key) {
  if (!key) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
