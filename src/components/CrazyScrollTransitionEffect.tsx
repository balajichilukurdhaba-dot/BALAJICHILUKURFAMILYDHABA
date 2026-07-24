"use client";
import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface CrazyScrollTransitionEffectProps {
  accentColor?: 'gold' | 'emerald' | 'amber';
}

export const CrazyScrollTransitionEffect: React.FC<CrazyScrollTransitionEffectProps> = ({
  accentColor = 'gold'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll position of this divider relative to viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth out scroll physics
  const smoothY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Transform values for scroll-driven animations
  const waveScaleX = useTransform(smoothY, [0, 0.5, 1], [0.6, 1.15, 0.8]);
  const waveY = useTransform(smoothY, [0, 0.5, 1], [40, 0, -40]);
  const opacity = useTransform(smoothY, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const glowBlur = useTransform(smoothY, [0, 0.5, 1], [10, 35, 10]);
  const particleY1 = useTransform(smoothY, [0, 1], [100, -120]);
  const particleY2 = useTransform(smoothY, [0, 1], [140, -160]);
  const particleY3 = useTransform(smoothY, [0, 1], [80, -90]);
  const rotate1 = useTransform(smoothY, [0, 1], [-15, 15]);
  const rotate2 = useTransform(smoothY, [0, 1], [20, -20]);

  return (
    <div ref={containerRef} className="relative w-full h-32 md:h-44 overflow-hidden pointer-events-none z-20 flex items-center justify-center my-[-2rem]">
      {/* 1. Ambient Glowing Layer */}
      <motion.div
        style={{ opacity, scaleX: waveScaleX }}
        className="absolute w-full max-w-5xl h-24 rounded-[100%] bg-gradient-to-r from-emerald-600/20 via-amber-400/35 to-emerald-600/20 blur-3xl"
      />

      {/* 2. Fluid Animated Wave Ribbon */}
      <motion.div
        style={{ y: waveY, scaleX: waveScaleX, opacity }}
        className="relative w-full max-w-7xl h-12 flex items-center justify-center px-4"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-12 text-[#1E4D2B]/15 drop-shadow-[0_10px_15px_rgba(224,178,82,0.3)]"
        >
          <path
            d="M0,0 C150,90 350,-40 500,45 C650,130 900,-30 1200,30 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>

        {/* Shimmer Light Pulse */}
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent w-1/3 h-full skew-x-12 blur-sm"
        />
      </motion.div>

      {/* 3. Upward Floating Golden Ember Sparks / Particles */}
      <div className="absolute inset-0 flex items-center justify-around px-8 max-w-6xl mx-auto">
        <motion.div
          style={{ y: particleY1, rotate: rotate1, opacity }}
          className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 shadow-[0_0_12px_#E0B252] blur-[1px]"
        />
        <motion.div
          style={{ y: particleY2, rotate: rotate2, opacity }}
          className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-gradient-to-tr from-emerald-400 to-amber-300 shadow-[0_0_10px_#1E4D2B] blur-[0.5px]"
        />
        <motion.div
          style={{ y: particleY3, rotate: rotate1, opacity }}
          className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-tr from-amber-300 via-amber-500 to-emerald-500 shadow-[0_0_15px_#E0B252] blur-[1px]"
        />
        <motion.div
          style={{ y: particleY1, rotate: rotate2, opacity }}
          className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]"
        />
      </div>

      {/* 4. Central Soft Floating Gold Core Line */}
      <motion.div
        style={{ scaleX: waveScaleX, opacity }}
        className="absolute w-3/4 max-w-4xl h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#E0B252]"
      />
    </div>
  );
};
