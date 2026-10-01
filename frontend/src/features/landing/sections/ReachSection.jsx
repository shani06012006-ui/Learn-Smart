// frontend/src/features/landing/sections/ReachSection.jsx
// Real world map (Natural Earth land data, baked into a dot-matrix) with smooth zoom-to-campus.
// Needs only react + lucide-react + Tailwind (standard classes). No framer-motion, no map library.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, MapPin, Calendar, ChevronDown, Check, Globe2, GraduationCap, FlaskConical, RotateCcw,
} from "lucide-react";

/* ---------- Map data ---------- */
const COLS = 240, ROWS = 95, STEP = 1.5;          // 1.5° dot grid, lat 84°N → 58°S
const MAP_W = 360, MAP_H = 142;                    // viewBox in degrees
const MAP_HEX = "000000000000000000000017fe0000000000000000000000000000000000000000000000001ffff9ffffffc60000000000000000000000000000000000000000000000ff7f9ffffffff8000004800196000007800000000000000000000000001a3ffc7fffffffc00000fc0000000000001c0000000000000000000000e00003803ffffffff00000300000000000100c00000000000000000000003dce18c0007fffffe0000000000001e00003fff0002f000000000000000740000000003fffffe000000000000600003fff8000000000000000000007fcc6adc0000ffffd800000000000180303ffffeffc02000000c0010000023fc0c6ff8007fffec0000000000008076ffffffffcfff80001001fffc0f23ffac127e01bffff0000000ffc0000c77fffffffffffffe0bcc07fffffffe0437985e003fff00000001fffc637ffbfffffffffffffffffec0fffffffffffff81fe07ff800000007ffde3fffd7fffffffffffffffff187ffffffffffffd0fe407f8007e00007c7e1fffffffffffffffffffffff0007ffffffffffd340f803f800300003fdfffffffffffffffffffffffffe003fffffffffffc08e3001f00000100ff3fffffffffffffffffffffffff8001ffbffffffff800fc000700000001ff3ffffffffffffffffffffff07c0000f801fffffff800fcc00000000001ff0fffffffffffffffffffe46180000014007ffffffc007fe000000000800e8fffffffffffffffffff800780000040000fffffff817fe000000000c0663fffffffffffffffffff000f800002000017fffffff9fff80000000320307ffffffffffffffffffc000f000000000003fffffff9fffe0000000370ffffffffffffffffffffffc00e000000000001fffffffdfffc0000000479ffffffffffffffffffffffd008000000000001ffffffffff1000000000c7ffffffffffffffffffffffd0100000000000007ffffffffd87000000001fffffffffffffffffffffff80000000000000007fffffffff80800000001fffffffffffffffffffffff80000000000000007fffffffffc0000000001fffff27f1ffffffffffffff00000000000000007ffffffffc80000000001ff3fe03e3fffffffffffffe30000000000000007ffffffff80000000003fc18fe00f1fffffffffffff070000000000000007fffffffe00000000003f8067e79f8ffffffffffffc000000000000000007fffffffe00000000003f00067fff8fffffffffff58060000000000000003fffffffc00000000003f00233fff8ffffffffffe1c040000000000000001fffffff80000000000082e0037ffdfffffffffff8c1c0000000000000001fffffff800000000000dfe00c2ffffffffffffff0cfc00000000000000007fffffe000000000001ffe0000ffffffffffffff02e000000000000000003fffffc000000000003fffc601ffffffffffffff8100000000000000000017ffffc000000000007ffff7ffffffffffffffff800000000000000000001fff984000000000007fffffffff3fffffffffff800000000000000000001bfe00400000000001fffffffcff9fffffffffff0000000000000000000005fe00600000000003fffffffeff83ffffffffff0000000000000000000004fe00000000000003fffffffe7fcc07fffffffe00000000000000000000007e00000000000007ffffffff3ffe03fffffffc80000000000000000000003e00100000000007ffffffffbfff03fff7ffe000000000000000000000003e0c0e0000000007ffffffff9ffe007fc3fe0000000000000000000000001f1c00c000000007ffffffff9ffc007f01fcc0000000000000000000000007f8000000000007ffffffffcff8007e01fe00c000000000000000000000013f000000000007ffffffffcfe0007c007f008000000000000000000000001f800000000007fffffffff7800038007f8080000000000000000000000003000000000007fffffffffc000038003f8000000000000000000000000001014000000007fffffffff8c0001800078070000000000000000000000000837e00000001ffffffffffc0001c000200000000000000000000000000004fff00000001ffffffffff800014002000300000000000000000000000000fff80000000ffffffffff800006001000100000000000000000000000000ffff80000003e0fffffff0000000198070000000000000000000000000007fffc0000000003ffffff00000000d80c000000000000000000000000000ffffc0000000001fffffc00000000683e040000000000000000000000001ffffc0000000003fffff800000000307ee40000000000000000000000003fffff8000000003fffff000000000187c04a000000000000000000000003fffffc000000003ffffe0000000003c7d809800000000000000000000003ffffffc00000001ffffe0000000000e0c487f00000000000000000000003fffffff00000000ffffe0000000000600000f80000000000000000000001fffffff80000000ffffc00000000003000047c0000000000000000000001fffffff800000007fffc0000000000038200f60000000000000000000000fffffff000000007fffc0000000000000200030000000000000000000000ffffffe000000007fffe00000000000000100000000000000000000000007fffffe000000007fffe000000000000001e1000000000000000000000007fffffc00000000ffffe08000000000000be3000000000000000000000003fffffc00000000ffffe1c000000000001fe3800000000000000000000000fffffc00000000ffff878000000000007ffb8000000000000000000000007ffffc00000000ffff078000000000007fffc000000000000000000000007ffff8000000007ffe03020000000001ffffe000000000000000000000007ffff8000000007fff07000000000007fffff002000000000000000000007fffc0000000003fff0700000000000ffffff800000000000000000000007fff00000000003ffe0600000000000ffffffc00000000000000000000007fff00000000003ffc0000000000001ffffffc00000000000000000000007fff00000000003ffc0000000000000ffffffc0000000000000000000000fffe00000000001ff800000000000007fffffc0000000000000000000000fffc00000000000ff000000000000007fffffc0000000000000000000000fff800000000000fe000000000000007f87ffc0000000000000000000000fff000000000000f8000000000000007c02ff80000000000000000000000ffc00000000000000000000000000000000ff00010000000000000000001ffc000000000000000000000000000000007f00008000000000000000001ff800000000000000000000000000000000340000e000000000000000001fe000000000000000000000000000000000000000c000000000000000001f80000000000000000000000000000000000e00008000000000000000001fc0000000000000000000000000000000000600030000000000000000001f000000000000000000000000000000000000000c0000000000000000001e000000000000000000000000000000000000001c0000000000000000003f00000000000000000000000000000000000000000000000000000000003e00000000000000000000000000000000000000000000000000000000003c00000000000000000000000000000000000000000000000000000000001c08000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000380000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

const project = (lon, lat) => ({ x: ((lon + 180) / MAP_W) * 100, y: ((84 - lat) / MAP_H) * 100 });

/* ---------- Campuses ---------- */
const TYPES = {
  campus:   { label: "Connected campus", icon: GraduationCap, bg: "bg-[#0b1f4d]", glow: "bg-blue-500" },
  research: { label: "Live research hub", icon: FlaskConical,  bg: "bg-emerald-500", glow: "bg-emerald-400" },
  study:    { label: "Global study node", icon: Globe2,        bg: "bg-violet-500", glow: "bg-violet-400" },
};

const CAMPUSES = [
  { name: "Harvard",    city: "Cambridge, USA",   lat: 42.37,  lng: -71.11, type: "campus" },
  { name: "Oxford",     city: "Oxford, UK",       lat: 51.75,  lng: -1.25,  type: "campus" },
  { name: "Cape Town",  city: "Cape Town, SA",    lat: -33.92, lng: 18.42,  type: "research" },
  { name: "IIT Bombay", city: "Mumbai, India",    lat: 19.13,  lng: 72.91,  type: "research" },
  { name: "Melbourne",  city: "Melbourne, AU",    lat: -37.81, lng: 144.96, type: "study" },
].map((c) => ({ ...c, ...project(c.lng, c.lat) }));

const TERMS = ["Fall 2026", "Spring 2027", "Summer 2027", "Fall 2027"];

const ZOOM = 3.4;
const ASPECT = 1.9;                         // map window shape (width / height): taller = bigger map
const R = MAP_W / MAP_H / ASPECT;           // base zoom so the map fills the window
const OVERVIEW = project(30, 8);            // initial view centre (lon, lat)
const EASE = "1100ms cubic-bezier(0.22, 1, 0.36, 1)";
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function distanceKm(aLat, aLng, bLat, bLng) {
  const r = Math.PI / 180;
  const dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/* ---------- Map ---------- */
function WorldMap({ active, onSelect }) {
  const [hovered, setHovered] = useState(null);

  // Decode the baked land mask into one SVG path of round dots.
  const dots = useMemo(() => {
    const per = COLS / 4;
    let d = "";
    for (let j = 0; j < ROWS; j++) {
      const row = MAP_HEX.slice(j * per, (j + 1) * per);
      for (let k = 0; k < per; k++) {
        const n = parseInt(row[k], 16);
        for (let b = 0; b < 4; b++) {
          if (n & (8 >> b)) {
            const i = k * 4 + b;
            d += `M${((i + 0.5) * STEP).toFixed(2)} ${((j + 0.5) * STEP).toFixed(2)}h0`;
          }
        }
      }
    }
    return d;
  }, []);

  const zoomed = active !== null;
  const z = zoomed ? ZOOM : R;
  const focus = zoomed ? CAMPUSES[active] : OVERVIEW;
  const tx = clamp(50 - z * focus.x, (1 - z) * 100, 0);
  const ty = clamp(50 * R - z * focus.y, (R - z) * 100, 0);
  const shown = hovered ?? active;

  return (
    <div
      className="relative w-full min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 shadow-xl"
      style={{ aspectRatio: ASPECT }}
    >
      {/* Zoomable stage: map + pins move together */}
      <div
        className="absolute left-0 top-0 w-full origin-top-left will-change-transform motion-reduce:!transition-none"
        style={{ aspectRatio: `${MAP_W} / ${MAP_H}`, transform: `translate(${tx}%, ${ty}%) scale(${z})`, transition: `transform ${EASE}` }}
      >
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 h-full w-full" aria-hidden>
          <path d={dots} stroke="#93b4f5" strokeWidth="0.95" strokeLinecap="round" fill="none" />
        </svg>

        {CAMPUSES.map((c, i) => {
          const T = TYPES[c.type];
          const Icon = T.icon;
          const isActive = active === i;
          return (
            <div key={c.name} className="absolute" style={{ left: `${c.x}%`, top: `${c.y}%`, zIndex: shown === i ? 30 : 10 }}>
              {/* counter-scale so pins keep their size while the map zooms */}
              <div
                style={{ transform: `translate(-50%, -50%) scale(${1 / z})`, transition: `transform ${EASE}` }}
                className="motion-reduce:!transition-none"
              >
                <button
                  type="button"
                  aria-label={`${c.name}, ${c.city}`}
                  aria-pressed={isActive}
                  onClick={() => onSelect(isActive ? null : i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full focus:outline-none"
                >
                  {/* radar glow */}
                  <span className={`absolute inset-0 animate-ping rounded-full opacity-40 motion-reduce:animate-none ${T.glow}`} />
                  <span className={`absolute -inset-1.5 rounded-full opacity-20 ${T.glow}`} />
                  <span className={`relative flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white text-white shadow-lg transition-transform hover:scale-110 ${T.bg} ${isActive ? "ring-4 ring-blue-300/70" : ""}`}>
                    <Icon size={16} />
                  </span>
                </button>

                {shown === i && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-3 block -translate-x-1/2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-xl">
                    <span className="block text-xs font-bold text-slate-900">{c.name}</span>
                    <span className="block text-[11px] text-slate-500">{c.city} · {T.label}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating stats pill (stays fixed while map zooms) */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-lg ring-1 ring-slate-200 backdrop-blur sm:bottom-4 sm:left-4">
        <Globe2 size={14} className="text-blue-600" />
        62 Countries • 150+ Campuses
      </div>

      {zoomed && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg ring-1 ring-slate-200 backdrop-blur hover:bg-white sm:right-4 sm:top-4"
        >
          <RotateCcw size={12} /> Reset view
        </button>
      )}
    </div>
  );
}

/* ---------- Search pill dropdown ---------- */
function Field({ icon: Icon, label, value, placeholder, options, onChange }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !box.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Icon size={18} className="shrink-0 text-blue-600" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
          <span className={`block truncate text-sm font-semibold ${value ? "text-slate-900" : "text-slate-400"}`}>{value || placeholder}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul role="listbox" className="absolute left-0 right-0 top-full z-40 mt-2 max-h-64 min-w-[12rem] overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {options.map((o) => (
            <li key={o.label} role="option" aria-selected={o.selected}>
              <button
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {o.label}
                {o.selected && <Check size={14} className="text-blue-600" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Section ---------- */
export default function ReachSection() {
  const [active, setActive] = useState(null);
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("");

  const select = (i) => {
    setActive(i);
    setStatus(i === null ? "" : `${CAMPUSES[i].name} · ${CAMPUSES[i].city}`);
  };

  const search = () => {
    if (active !== null) return select(active);
    if (!navigator.geolocation) return setStatus("Choose a campus from the list.");
    setStatus("Finding your nearest campus…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        let best = 0, min = Infinity;
        CAMPUSES.forEach((c, i) => {
          const d = distanceKm(coords.latitude, coords.longitude, c.lat, c.lng);
          if (d < min) { min = d; best = i; }
        });
        setActive(best);
        setStatus(`Nearest: ${CAMPUSES[best].name} (${Math.round(min)} km away)`);
      },
      () => setStatus("Location blocked. Choose a campus from the list."),
      { timeout: 8000 }
    );
  };

  return (
    <section id="reach" className="relative scroll-mt-16 overflow-hidden py-20 md:py-28">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1.35fr_1fr] lg:gap-12 lg:px-8">
        <div className="order-2 min-w-0 lg:order-1">
          <WorldMap active={active} onSelect={select} />
        </div>

        <div className="order-1 min-w-0 lg:order-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl xl:text-5xl">
            Seamless Campus &amp;{" "}
            <span className="bg-gradient-to-r from-[#0b1f4d] to-blue-500 bg-clip-text text-transparent">Remote Connectivity.</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Deploy across physical campuses, hybrid environments, or multi-branch educational networks effortlessly.
          </p>

          <div className="mt-8 flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-xl sm:flex-row sm:items-center sm:rounded-full">
            <Field
              icon={MapPin}
              label="Location"
              value={active === null ? "" : CAMPUSES[active].name}
              placeholder="Select campus"
              onChange={select}
              options={CAMPUSES.map((c, i) => ({ value: i, label: `${c.name} · ${c.city}`, selected: active === i }))}
            />
            <span aria-hidden className="hidden h-8 w-px bg-slate-200 sm:block" />
            <Field
              icon={Calendar}
              label="Academic Year"
              value={term}
              placeholder="Select term"
              onChange={setTerm}
              options={TERMS.map((t) => ({ value: t, label: t, selected: t === term }))}
            />
            <button
              type="button"
              aria-label="Search campuses"
              onClick={search}
              className="flex h-12 w-full shrink-0 items-center justify-center rounded-full bg-[#0b1f4d] text-white shadow-md transition-colors hover:bg-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-12"
            >
              <Search size={18} />
            </button>
          </div>
          <p role="status" aria-live="polite" className="mt-3 min-h-[1.25rem] px-2 text-sm text-slate-500">{status}</p>
        </div>
      </div>
    </section>
  );
}