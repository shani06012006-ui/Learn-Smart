import clsx from "clsx";

// Swappable character component. Renders the illustration passed via the
// `illustration` prop, or falls back to an abstract gradient placeholder
// (same slot, same size, same animation) so the entire landing page can be
// built, tested, and shipped before the real art exists.
//
// To swap in real art later: pass `illustration={<MyCharacter pose="studying" />}`
// or `illustration={<img src="/assets/student-studying.png" alt="" />}`. The
// wrapper handles all entrance/idle/pose animation; the illustration does not
// need to know about any of it.
//
// Poses: "idle" | "pointing" | "studying" | "celebrating" | "joining"
// Entrance plays once when the component first mounts (or when `reveal`
// flips true, if controlled by the parent).

const POSE_CLASS = {
  idle: "character--idle",
  pointing: "character--pointing",
  studying: "character--studying",
  celebrating: "character--celebrating",
  joining: "character--joining",
};

export default function StudentCharacter({
  pose = "idle",
  illustration = null,
  reveal = true,
  size = "md", // "sm" | "md" | "lg"
  className,
}) {
  const SIZES = {
    sm: "w-40 h-52 md:w-48 md:h-64",
    md: "w-56 h-72 md:w-72 md:h-96",
    lg: "w-72 h-96 md:w-96 md:h-[30rem]",
  };

  return (
    <div
      className={clsx(
        "landing-character relative select-none",
        SIZES[size] || SIZES.md,
        POSE_CLASS[pose] || POSE_CLASS.idle,
        reveal && "is-revealed",
        className
      )}
      aria-hidden="true"
    >
      {/* Ambient glow behind the character */}
      <div className="landing-character-glow absolute inset-0 -z-10" />

      {illustration ? (
        <div className="landing-character-art h-full w-full">{illustration}</div>
      ) : (
        <CharacterPlaceholder />
      )}
    </div>
  );
}

// Abstract, non-specific placeholder. Renders a soft flat-vector-shaped
// silhouette that reads as "a person" without pretending to be a real
// illustration. When the real art is ready, this component is simply not
// rendered any more.
function CharacterPlaceholder() {
  return (
    <div className="landing-character-placeholder relative flex h-full w-full items-end justify-center">
      {/* Body */}
      <div className="relative h-[78%] w-[70%]">
        {/* Head */}
        <div className="landing-char-head absolute left-1/2 top-0 h-[26%] w-[38%] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-300 to-brand-400" />
        {/* Torso */}
        <div className="absolute bottom-0 left-1/2 h-[68%] w-full -translate-x-1/2 rounded-t-[3rem] rounded-b-xl bg-gradient-to-b from-brand-400 to-brand-600" />
        {/* Backpack hint */}
        <div className="absolute bottom-[8%] right-[6%] h-[42%] w-[38%] rounded-xl bg-ink-700/90" />
        {/* Tablet hint */}
        <div className="absolute bottom-[30%] left-[4%] h-[36%] w-[46%] rotate-[-8deg] rounded-lg bg-white shadow-md ring-1 ring-ink-200" />
      </div>

      {/* Feet */}
      <div className="absolute bottom-0 left-[30%] h-[6%] w-[16%] rounded-full bg-ink-700" />
      <div className="absolute bottom-0 right-[30%] h-[6%] w-[16%] rounded-full bg-ink-700" />
    </div>
  );
}
