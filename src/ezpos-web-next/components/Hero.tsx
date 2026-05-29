'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faCircleCheck, faCrown } from '@fortawesome/free-solid-svg-icons';

const floatingVariants = {
  animate: {
    y: [0, -12, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export default function Hero() {
  return (
    <Box
      component="section"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0A0A0F 0%, #0D0D1A 50%, #0A0A0F 100%)',
        pt: { xs: 12, md: 8 },
      }}
    >
      {/* Background glows */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '-10%',
          width: { xs: '60vw', md: '45vw' },
          height: { xs: '60vw', md: '45vw' },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '-5%',
          width: { xs: '50vw', md: '35vw' },
          height: { xs: '50vw', md: '35vw' },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,107,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: { xs: 6, lg: 8 },
            alignItems: 'center',
          }}
        >
          {/* Left - Text */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <Chip
                icon={<FontAwesomeIcon icon={faCrown} />}
                label="Premium POS Licensing Platform"
                sx={{
                  mb: 3,
                  background: 'rgba(108,99,255,0.12)',
                  color: '#8A84FF',
                  border: '1px solid rgba(108,99,255,0.3)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  letterSpacing: '0.02em',
                }}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Typography
                variant="h1"
                sx={{
                  background: 'linear-gradient(135deg, #FFFFFF 30%, rgba(255,255,255,0.65) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 3,
                }}
              >
                Professional POS Licensing,{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #6C63FF 0%, #8A84FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Simplified
                </Box>
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255,255,255,0.6)', mb: 4, maxWidth: 480, fontSize: '1.05rem' }}
              >
                A clean, premium onboarding experience for one-time licensing. Ship-ready UI
                built for modern POS deployments — secure, scalable, and portal-ready.
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Link href="/pricing" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      background: 'linear-gradient(135deg, #6C63FF 0%, #8A84FF 100%)',
                      py: 1.6,
                      px: 4,
                      fontSize: '1rem',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a52e0 0%, #7b75f5 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 30px rgba(108,99,255,0.45)',
                      },
                    }}
                  >
                    View Plans
                  </Button>
                </Link>
                <Link href="/#features" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      py: 1.6,
                      px: 4,
                      fontSize: '1rem',
                      borderColor: 'rgba(255,255,255,0.18)',
                      color: 'rgba(255,255,255,0.85)',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.4)',
                        background: 'rgba(255,255,255,0.04)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Explore Features
                  </Button>
                </Link>
              </Box>
            </motion.div>

            {/* Metrics row */}
            <motion.div variants={itemVariants}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 4,
                  mt: 5,
                  pt: 4,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { label: 'Fast Setup', desc: 'Ship-ready foundation' },
                  { label: 'Secure Flow', desc: 'API integration ready' },
                  { label: 'Scalable', desc: 'Portal & dashboard ready' },
                ].map((m) => (
                  <Box key={m.label}>
                    <Typography
                      sx={{ fontWeight: 700, color: 'white', fontSize: '1rem', mb: 0.3 }}
                    >
                      {m.label}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>
                      {m.desc}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </motion.div>
          </motion.div>

          {/* Right - Visual Card */}
          <motion.div
            variants={floatingVariants}
            animate="animate"
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Box
                sx={{
                  width: { xs: '100%', md: 420 },
                  maxWidth: 420,
                  background: 'rgba(18,18,26,0.9)',
                  border: '1px solid rgba(108,99,255,0.25)',
                  borderRadius: 4,
                  p: 4,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,99,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Glow effect inside card */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Card header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #6C63FF 0%, #8A84FF 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    <FontAwesomeIcon icon={faBolt} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      EZPos Dashboard
                    </Typography>
                    <Typography sx={{ color: '#4ECDC4', fontSize: '0.78rem', fontWeight: 600 }}>
                      <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: 6 }} />
                      License Active
                    </Typography>
                  </Box>
                </Box>

                {/* Stats */}
                {[
                  { label: 'License Status', value: 'Professional', color: '#6C63FF' },
                  { label: 'Activation Date', value: 'Jan 2025', color: 'rgba(255,255,255,0.6)' },
                  { label: 'Expiry', value: 'Lifetime', color: '#4ECDC4' },
                  { label: 'Branches', value: '1 / Unlimited', color: 'rgba(255,255,255,0.6)' },
                ].map((stat) => (
                  <Box
                    key={stat.label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1.4,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                      {stat.label}
                    </Typography>
                    <Typography sx={{ color: stat.color, fontWeight: 600, fontSize: '0.85rem' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                ))}

                {/* Action button */}
                <Box sx={{ mt: 3 }}>
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(138,132,255,0.1) 100%)',
                      border: '1px solid rgba(108,99,255,0.3)',
                      borderRadius: 2,
                      py: 1.2,
                      textAlign: 'center',
                      cursor: 'default',
                    }}
                  >
                    <Typography sx={{ color: '#8A84FF', fontWeight: 600, fontSize: '0.85rem' }}>
                      Manage License →
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}
