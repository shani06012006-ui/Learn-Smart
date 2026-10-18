// frontend/src/features/landing/components/ChalkDoodles.jsx
import { motion, useReducedMotion } from "framer-motion";

/*
  Chalk-style doodles that "draw" themselves around the hero photo.
  The SVG is laid over a 400 x 500 photo box; its viewBox reaches 90 units
  beyond every edge so doodles can sit outside the photo.
*/

const star = (r = 11) =>
  `M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r}Z`;
const ellipse = (rx, ry) =>
  `M${-rx} 0 a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;

// x / y = where the doodle sits; paths are drawn around (0,0)
const DOODLES = [
  {
    // light bulb
    x: -5, y: 40, delay: 0.5,
    paths: [
      "M-25 18 C-41 -2 -33 -38 0 -38 C33 -38 41 -2 25 18 C19 26 19 32 19 38 H-19 C-19 32 -19 26 -25 18Z",
      "M-13 50 H13", "M-7 62 H7",
      "M0 -56 V-74", "M-34 -46 L-46 -58", "M34 -46 L46 -58", "M-50 -12 H-66", "M50 -12 H66",
    ],
  },
  {
    // rising arrow
    x: 395, y: -10, delay: 0.8,
    paths: ["M0 40 C30 30 60 10 90 -30", "M90 -30 L68 -28", "M90 -30 L86 -8"],
  },
  { x: 250, y: -50, delay: 1.0, paths: ["M0 0 l10 -16 l10 16 l10 -16 l10 16"] },
  {
    // open book
    x: 415, y: 250, delay: 1.1,
    paths: [
      "M-30 8 C-16 -2 6 -2 20 8 V48 C6 38 -16 38 -30 48Z",
      "M20 8 C34 -2 56 -2 70 8 V48 C56 38 34 38 20 48",
    ],
  },
  {
    // atom: three tilted orbits + nucleus
    x: -35, y: 330, delay: 1.3,
    paths: [ellipse(34, 12), ellipse(34, 12), ellipse(34, 12), "M-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0"],
    rotations: [0, 60, 120, 0],
  },
  {
    // "A+"
    x: 40, y: 530, delay: 1.5,
    paths: ["M0 30 L10 0 L20 30", "M4 20 H16", "M28 15 H44", "M36 7 V23"],
  },
  { x: -40, y: 200, delay: 1.4, paths: [star(12)] },
  { x: 430, y: 120, delay: 1.6, paths: [star(10)] },
  { x: 440, y: 410, delay: 1.7, paths: [star(9)] },
  { x: 60, y: -48, delay: 1.2, paths: [star(9)] },
];

export default function ChalkDoodles() {
  const reduce = useReducedMotion();

  return (
    <svg
      aria-hidden="true"
      viewBox="-90 -90 580 680"
      className="pointer-events-none absolute -left-[22.5%] -top-[18%] hidden h-[136%] w-[145%] overflow-visible sm:block"
      fill="none"
      stroke="rgba(255,255,255,0.88)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {DOODLES.map((d, di) => (
        <g key={di} transform={`translate(${d.x} ${d.y})`}>
          {d.paths.map((p, pi) => (
            <g key={pi} transform={d.rotations ? `rotate(${d.rotations[pi]})` : undefined}>
              <motion.path
                d={p}
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: d.delay + pi * 0.1, ease: "easeInOut" }}
              />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}