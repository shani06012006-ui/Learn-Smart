// frontend/src/features/landing/sections/Panel2Bento.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Monitor, Code, LineChart, Network } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const BRANDS = ["Apple", "Google", "Microsoft", "Sony"];

const CARDS = [
  { icon: Monitor, title: "Technology", desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  { icon: Code, title: "Engineering", desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  { icon: LineChart, title: "Business", desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  { icon: Network, title: "Infrastructure", desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
];

export default function Panel2Bento() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative w-full overflow-hidden bg-white py-20 lg:py-28">
      <div className="container-wide">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
            className="font-display text-3xl font-extrabold leading-tight text-[#0a0f16] sm:text-4xl md:text-5xl"
          >
            Explore Your Learning Path And<br />Discover Opportunities
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate
            libero et velit interdum, ac aliquet odio mattis.
          </motion.p>
        </div>

        {/* Trusted Logos Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 rounded-2xl bg-[#0a0f16] px-8 py-6 sm:gap-16 sm:px-12"
        >
          {BRANDS.map((brand) => (
            <span key={brand} className="text-sm font-extrabold tracking-widest text-slate-300 sm:text-base">
              {brand}
            </span>
          ))}
        </motion.div>

        {/* 4 Grid Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.3 + i * 0.1, ease: EASE }}
                className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 transition-colors group-hover:bg-[#0a0f16] group-hover:text-white">
                  <Icon size={22} />
                </span>
                <h3 className="mt-6 font-display text-lg font-extrabold text-[#0a0f16]">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {c.desc}
                </p>
                <div className="mt-auto pt-6">
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 transition-colors group-hover:bg-[#0a0f16] group-hover:text-white">
                    Explore
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}