'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <Box
      id="contact"
      component="section"
      ref={ref}
      sx={{
        py: { xs: 10, md: 14 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(108,99,255,0.1) 0%, rgba(18,18,26,0.9) 100%)',
              border: '1px solid rgba(108,99,255,0.25)',
              borderRadius: 4,
              p: { xs: 5, md: 7 },
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Corner glows */}
            <Box
              sx={{
                position: 'absolute',
                top: -60,
                left: -60,
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(108,99,255,0.14) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -60,
                right: -60,
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,107,107,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography
                variant="h2"
                sx={{ color: 'white', mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
              >
                Ready to launch EZPos with confidence?
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.55)',
                  mb: 4,
                  maxWidth: 460,
                  mx: 'auto',
                  fontSize: '1rem',
                }}
              >
                Start with a polished customer-facing foundation and expand without refactoring.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/pricing" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      background: 'linear-gradient(135deg, #6C63FF 0%, #8A84FF 100%)',
                      py: 1.6,
                      px: 4,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a52e0 0%, #7b75f5 100%)',
                        boxShadow: '0 8px 30px rgba(108,99,255,0.45)',
                      },
                    }}
                  >
                    Get EZPos License
                  </Button>
                </Link>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    py: 1.6,
                    px: 4,
                    borderColor: 'rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.35)',
                      background: 'rgba(255,255,255,0.04)',
                    },
                  }}
                >
                  Contact Sales
                </Button>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
