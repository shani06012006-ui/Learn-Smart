// frontend/src/features/landing/sections/MentorSection.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function MentorSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="mentor" className="section-pad relative overflow-hidden">
      <div ref={ref} className="container-wide">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ── LEFT — circular photo with orange gradient ─────── */}
          <div className="relative min-w-0 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, ease: EASE }}
              className="relative mx-auto aspect-square w-full max-w-md"
            >
              {/* Orange radial gradient circle behind */}
              <div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 50% 35%, #ff8a5b 0%, #ff6d3a 45%, #ff5722 70%, rgba(255,87,34,0) 100%)",
                }}
              />

              {/* Circular photo — replace with your URL */}
              {/* HERE IS YOUR IMAGE — mentor portrait — paste a URL below */}
              <div className="absolute inset-6 overflow-hidden rounded-full">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80"
                  alt="Mentor portrait"
                  className="h-full w-full object-cover object-top"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT — copy ───────────────────────────────────── */}
          <div className="min-w-0 lg:col-span-7">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
              className="h2 max-w-xl"
            >
              Want to share your knowledge?{" "}
              <span className="text-coral-500">Join us a Mentor</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
              className="body-lg mt-5 max-w-lg"
            >
              High-definition video is video of higher resolution and quality
              than standard-definition. While there is no standardized meaning
              for high-definition, generally any video.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.34, ease: EASE }}
              className="mt-8"
            >
              <a href="#career" className="btn-purple">
                Career Information
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
