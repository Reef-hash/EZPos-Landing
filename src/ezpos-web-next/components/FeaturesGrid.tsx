'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBolt,
  faShieldHalved,
  faChartLine,
  faBoxesStacked,
  faBuilding,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';

type Feature = {
  icon: IconDefinition;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: faBolt,
    title: 'Fast Onboarding',
    description:
      'Simple, guided flow from landing page to checkout-ready plan selection in minutes — no friction, no confusion.',
  },
  {
    icon: faShieldHalved,
    title: 'Secure License Foundation',
    description:
      'API-based key generation and real-time online validation. Each license is cryptographically secured and tied to your deployment.',
  },
  {
    icon: faChartLine,
    title: 'Dashboard Expansion',
    description:
      'Layout and component strategy built for future customer portal growth. Add analytics, usage tracking, and admin panels without rebuilding.',
  },
  {
    icon: faBoxesStacked,
    title: 'Inventory Visibility',
    description:
      'Track products across all branches in real time. Low stock alerts, reorder suggestions, and full audit trails included.',
  },
  {
    icon: faBuilding,
    title: 'Multi-Branch Ready',
    description:
      'Centralized control panel for multi-location rollouts. Manage licenses, users, and data from a single dashboard.',
  },
  {
    icon: faRocket,
    title: 'Ship-Ready UI',
    description:
      'Production-grade components with TypeScript, accessibility-first design, and full dark mode by default.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.08,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export default function FeaturesGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <Box
      id="features"
      component="section"
      ref={ref}
      sx={{
        py: { xs: 10, md: 14 },
        background: '#0A0A0F',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top separator glow */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.4), transparent)',
        }}
      />

      <Container maxWidth="lg">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          <Typography
            component="p"
            sx={{
              color: '#6C63FF',
              fontWeight: 600,
              fontSize: '0.8rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              mb: 1.5,
            }}
          >
            Why Teams Choose EZPos
          </Typography>
          <Typography variant="h2" sx={{ color: 'white', mb: 2 }}>
            Designed for structured rollout,{' '}
            <Box component="span" sx={{ color: 'rgba(255,255,255,0.45)' }}>
              not one-off demos
            </Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'rgba(255,255,255,0.5)', maxWidth: 560, mx: 'auto' }}
          >
            Everything is organized to guide users from evaluation to purchase with clear
            hierarchy and predictable interaction patterns.
          </Typography>
        </motion.div>

        {/* Feature cards grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <Box
                sx={{
                  background: 'rgba(18,18,26,0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 3,
                  p: 3.5,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                  '&:hover': {
                    border: '1px solid rgba(108,99,255,0.3)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
                    '& .feature-icon-bg': {
                      opacity: 1,
                    },
                  },
                }}
              >
                {/* Hover glow behind icon */}
                <Box
                  className="feature-icon-bg"
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: -20,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none',
                  }}
                />

                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    background: 'rgba(108,99,255,0.1)',
                    border: '1px solid rgba(108,99,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    mb: 2.5,
                  }}
                >
                  <FontAwesomeIcon icon={feature.icon} />
                </Box>

                <Typography
                  variant="h6"
                  sx={{ color: 'white', fontWeight: 700, mb: 1.2, fontSize: '1rem' }}
                >
                  {feature.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}
                >
                  {feature.description}
                </Typography>
              </Box>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
