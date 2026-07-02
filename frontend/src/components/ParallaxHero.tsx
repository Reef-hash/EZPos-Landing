'use client';

import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';

interface Layer {
  depth: number;       // 0 = static, 1 = max parallax
  children: ReactNode;
  className?: string;
}

interface ParallaxHeroProps {
  /** Background gradient layer */
  background?: ReactNode;
  /** Mid-ground layers — rendered in order, higher index = more depth */
  layers?: Layer[];
  /** Foreground content (text, buttons) */
  children: ReactNode;
  className?: string;
  /** Max translate offset in px. Default 20. */
  maxOffset?: number;
}

/**
 * Multi-layer parallax hero section.
 * Each layer moves at a different speed based on mouse position,
 * creating a convincing 3D depth illusion.
 *
 * Usage:
 *   <ParallaxHero
 *     background={<div className="..." />}
 *     layers={[
 *       { depth: 0.3, children: <img /> },
 *       { depth: 0.6, children: <img /> },
 *     ]}
 *   >
 *     <h1>Title</h1>
 *   </ParallaxHero>
 */

/* ── Individual parallax layer (component avoids hooks-in-loop) ── */
function ParallaxLayer({
  springX,
  springY,
  depth,
  maxOffset,
  className = '',
  style,
  children,
}: {
  springX: any;
  springY: any;
  depth: number;
  maxOffset: number;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const offsetPx = maxOffset * depth;
  const x = useTransform(springX, [-1, 1], [-offsetPx, offsetPx]);
  const y = useTransform(springY, [-1, 1], [-offsetPx, offsetPx]);

  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      style={{ x, y, translateZ: `${depth * 50}px`, ...style }}
      aria-hidden
    >
      {children}
    </motion.div>
  );
}

export default function ParallaxHero({
  background,
  layers = [],
  children,
  className = '',
  maxOffset = 20,
}: ParallaxHeroProps) {
  const prefersReduced = useReducedMotion();

  // Mouse position normalized to [-1, 1]
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  function handleMouseMove(e: React.MouseEvent) {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <section
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: prefersReduced ? 'none' : '1500px' }}
    >
      {/* Background layer — always static */}
      {background && (
        <div className="absolute inset-0 z-0" aria-hidden>
          {background}
        </div>
      )}

      {/* Parallax layers — uses a proper component to comply with Rules of Hooks */}
      {!prefersReduced &&
        layers.map((layer, i) => (
          <ParallaxLayer
            key={i}
            springX={springX}
            springY={springY}
            depth={layer.depth}
            maxOffset={maxOffset}
            className={layer.className ?? ''}
            style={{ zIndex: i + 1 }}
          >
            {layer.children}
          </ParallaxLayer>
        ))}

      {/* Foreground content — no translateZ to avoid perspective scaling clipping */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}
