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
        <div className="grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left — circular photo */}
          <div className="relative order-1 min-w-0 lg:order-none lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, ease: EASE }}
              className="relative mx-auto aspect-square w-full max-w-[260px] sm:max-w-xs md:max-w-sm lg:max-w-md"
            >
              <div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 50% 35%, #ff8a5b 0%, #ff6d3a 45%, #ff5722 70%, rgba(255,87,34,0) 100%)",
                }}
              />
              <div className="absolute inset-4 overflow-hidden rounded-full sm:inset-6">
                <img
                  src="https://i.pinimg.com/736x/4e/5d/84/4e5d84e967cdf19ece54aaa281220669.jpg"
                  alt="Mentor portrait"
                  className="h-full w-full object-cover object-top"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Right — copy (center on mobile, left on desktop) */}
          <div className="min-w-0 text-center lg:col-span-7 lg:text-left">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
              className="h2 mx-auto max-w-xl lg:mx-0"
            >
              Want to share your knowledge?{" "}
              <span className="text-coral-500">Join us as a Mentor</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
              className="body-lg mx-auto mt-5 max-w-lg lg:mx-0"
            >
              High-definition video is video of higher resolution and quality
              than standard-definition. While there is no standardized meaning
              for high-definition, generally any video.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.34, ease: EASE }}
              className="mt-6 flex justify-center sm:mt-8 lg:justify-start"
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