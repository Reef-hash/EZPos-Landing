'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';

interface ScrollParallaxProps {
  children: ReactNode;
  className?: string;
  /** Offset in pixels. Default 80. */
  offset?: number;
  /** Reverse direction. Default false. */
  reverse?: boolean;
}

/**
 * Scroll-driven parallax — content moves at a different speed than scroll.
 * Uses `useScroll` + `useTransform` from Framer Motion.
 * Hardware-accelerated via `transform` string.
 *
 * Usage:
 *   <ScrollParallax offset={100}>
 *     <img src="..." />
 *   </ScrollParallax>
 */
export default function ScrollParallax({
  children,
  className = '',
  offset = 80,
  reverse = false,
}: ScrollParallaxProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Track scroll progress relative to this element
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Map scroll progress to Y offset
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reverse ? [offset, -offset] : [-offset, offset],
  );

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y, willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}
