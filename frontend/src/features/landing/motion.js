// Single source of truth for every animation on the landing page.
// Consistent easings + spring physics = coherent feel.

export const EASE = {
  smooth: [0.22, 1, 0.36, 1],       // default reveal
  smoothOut: [0.16, 1, 0.3, 1],     // softer exits
  sharp: [0.4, 0, 0.2, 1],          // for hover / small moves
  overshoot: [0.34, 1.56, 0.64, 1], // cards that settle with bounce
};

export const SPRING = {
  // For scroll smoothing — heavy, no bounce, just inertia
  scroll: { stiffness: 90, damping: 24, mass: 0.5, restDelta: 0.001 },
  // For cards arriving
  card: { type: "spring", stiffness: 220, damping: 26, mass: 0.9 },
  // For UI elements reacting to cursor
  ui: { type: "spring", stiffness: 400, damping: 30, mass: 0.6 },
  // For draggable cards returning home
  drag: { type: "spring", stiffness: 320, damping: 26, mass: 1 },
};

export const DURATION = {
  fast: 0.3,
  base: 0.55,
  slow: 0.8,
  reveal: 0.7,
};