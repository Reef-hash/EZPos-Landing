'use client';

import {
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  motion,
} from 'framer-motion';
import { useRef, type ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. Default 6. Keep subtle (3-8). */
  maxTilt?: number;
  /** Scale on hover. Default 1.02. */
  scale?: number;
  /** Light effect on hover. Default true. */
  glare?: boolean;
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 6,
  scale = 1.02,
  glare = true,
}: TiltCardProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(springY, [-1, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [-1, 1], [-maxTilt, maxTilt]);

  function handleMouseMove(e: React.MouseEvent) {
    if (prefersReduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${className} relative`}
      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
      whileHover={{ scale }}
      transition={{ scale: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      >
        {children}
      </motion.div>

      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ background: 'transparent' }}
          aria-hidden
        />
      )}
    </motion.div>
  );
}
