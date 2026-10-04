// frontend/src/components/ui/Avatar.jsx
const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

const GRADIENTS = [
  "from-purple-500 to-purple-700",
  "from-coral-500 to-coral-700",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-coral-500",
  "from-purple-500 to-coral-500",
  "from-teal-500 to-emerald-700",
];

function pickGradient(seed) {
  if (seed == null) return GRADIENTS[0];
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export default function Avatar({ userId, initials = "?", size = "md", className = "" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-black uppercase text-white ${pickGradient(
        userId
      )} ${SIZES[size] || SIZES.md} ${className}`}
    >
      {initials}
    </span>
  );
}