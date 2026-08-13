"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Purely decorative 3D-animated layer that sits behind the hero copy/CTAs.
 *
 * - A handful of "crystal" shapes (rounded slab, ring, diamond, orb) continuously spin in true
 *   3D space (perspective + transform-style: preserve-3d + translateZ), so they visibly
 *   foreshorten as they rotate instead of just scaling like a flat CSS animation would.
 * - The whole scene also tilts a few degrees toward the cursor (spring-smoothed, not snappy),
 *   giving a subtle parallax-depth feel as the visitor moves their mouse over the hero.
 * - Floating particles drift up/down at staggered speeds to sell extra depth-of-field.
 *
 * Everything here is `pointer-events-none` and stacked at z-0, so it never intercepts clicks on
 * the real hero content (title / countdown / CTA buttons), which renders above it at z-10.
 */
export function Hero3DBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const sceneRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 50,
    damping: 20,
  });
  const sceneRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 50,
    damping: 20,
  });

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    }
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [mouseX, mouseY]);

  return (
    <div className="perspective-1000 pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <motion.div
        style={{ rotateX: sceneRotateX, rotateY: sceneRotateY, transformStyle: "preserve-3d" }}
        className="relative h-full w-full"
      >
        {/* Crystal 1 - top right, largest slab, brand-pink */}
        <motion.div
          className="absolute right-[8%] top-[14%] h-28 w-28 sm:h-40 sm:w-40"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="h-full w-full rounded-2xl border border-brand-pink/40 bg-gradient-to-br from-brand-pink/20 via-fuchsia-500/10 to-transparent shadow-[0_0_60px_rgb(var(--color-brand-pink-rgb) / 0.35)] backdrop-blur-sm"
            style={{ transform: "translateZ(40px)" }}
          />
        </motion.div>

        {/* Crystal 2 - left, spinning orb, brand-purple */}
        <motion.div
          className="absolute left-[10%] top-[24%] h-20 w-20 sm:h-28 sm:w-28"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: [360, 0], rotateY: [0, -360] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="h-full w-full rounded-full border border-brand-purple/50 bg-gradient-to-tr from-brand-purple/25 to-transparent shadow-[0_0_50px_rgb(var(--color-brand-purple-rgb) / 0.4)]"
            style={{ transform: "translateZ(30px)" }}
          />
        </motion.div>

        {/* Crystal 3 - bottom right, tumbling diamond */}
        <motion.div
          className="absolute bottom-[16%] right-[18%] h-16 w-16"
          animate={{ rotate: [45, 405] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        >
          <div className="animate-pulse-glow h-full w-full rounded-lg border border-white/20 bg-gradient-to-br from-white/10 to-brand-pink/20" />
        </motion.div>

        {/* Crystal 4 - bottom left, floating + spinning ring */}
        <motion.div
          className="animate-elegant-float absolute bottom-[12%] left-[16%] h-24 w-24"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        >
          <div className="h-full w-full rounded-full border-2 border-brand-pink/30" />
        </motion.div>

        {/* Ambient floating particles for extra depth */}
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white/60"
            style={{ top: p.top, left: p.left, width: p.size, height: p.size, filter: `blur(${p.blur}px)` }}
            animate={{ y: [0, -18, 0], opacity: [0.15, 0.75, 0.15] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}
      </motion.div>
    </div>
  );
}

const PARTICLES = [
  { top: "20%", left: "30%", size: 4, blur: 0, duration: 5, delay: 0 },
  { top: "35%", left: "72%", size: 3, blur: 0.5, duration: 6, delay: 0.5 },
  { top: "62%", left: "45%", size: 5, blur: 0, duration: 4.5, delay: 1 },
  { top: "72%", left: "80%", size: 3, blur: 0.5, duration: 7, delay: 1.5 },
  { top: "16%", left: "55%", size: 4, blur: 0, duration: 5.5, delay: 0.8 },
  { top: "48%", left: "12%", size: 3, blur: 0.5, duration: 6.5, delay: 0.3 },
];
