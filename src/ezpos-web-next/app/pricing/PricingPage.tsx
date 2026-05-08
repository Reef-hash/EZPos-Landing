'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PricingSection from '@/components/PricingSection';
import CtaSection from '@/components/CtaSection';

const tableRows = [
  { capability: 'License model', pro: 'One-time', growth: 'Planned' },
  { capability: 'Validation API', pro: 'Included', growth: 'Roadmap', proHighlight: true },
  { capability: 'Portal readiness', pro: 'Included', growth: 'Included', proHighlight: true, growthHighlight: true },
  { capability: 'Multi-branch', pro: '1 branch', growth: 'Unlimited' },
  { capability: 'Priority support', pro: 'Standard', growth: 'Priority', growthHighlight: true },
  { capability: 'Updates', pro: '12 months', growth: '24 months', growthHighlight: true },
];

export default function PricingPage() {
  return (
    <Box sx={{ background: '#0A0A0F', minHeight: '100vh' }}>
      {/* Hero header */}
      <Box
        sx={{
          pt: { xs: 16, md: 18 },
          pb: { xs: 8, md: 10 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%',
            height: '100%',
            background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.08) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
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
              Pricing
            </Typography>
            <Typography variant="h1" sx={{ color: 'white', mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
              Simple, transparent plans
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.55)', maxWidth: 480, mx: 'auto', fontSize: '1.05rem' }}>
              Designed for one-time purchases now, structured for subscription tiers later.
              Choose what fits your rollout stage.
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* Pricing Cards */}
      <PricingSection showHeader={false} />

      {/* Comparison Table */}
      <Box
        component="section"
        sx={{ py: { xs: 8, md: 12 }, background: 'rgba(18,18,26,0.4)' }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h3"
              sx={{ color: 'white', mb: 4, textAlign: 'center', fontWeight: 700 }}
            >
              Plan Comparison
            </Typography>

            <Box
              component="table"
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
                '& th, & td': {
                  py: 2,
                  px: 3,
                  textAlign: 'left',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.9rem',
                },
                '& th': {
                  color: 'rgba(255,255,255,0.45)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: 'rgba(255,255,255,0.02)',
                },
                '& tr:hover td': {
                  background: 'rgba(255,255,255,0.02)',
                },
              }}
              aria-label="EZPos plan comparison"
            >
              <thead>
                <tr>
                  <Box component="th" sx={{ width: '40%' }}>Capability</Box>
                  <Box component="th">Professional</Box>
                  <Box component="th">Growth</Box>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.capability}>
                    <Box component="td" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                      {row.capability}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        color: row.proHighlight ? '#4ECDC4' : 'rgba(255,255,255,0.5)',
                        fontWeight: row.proHighlight ? 600 : 400,
                      }}
                    >
                      {row.pro}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        color: row.growthHighlight ? '#4ECDC4' : 'rgba(255,255,255,0.4)',
                        fontWeight: row.growthHighlight ? 600 : 400,
                      }}
                    >
                      {row.growth}
                    </Box>
                  </tr>
                ))}
              </tbody>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Add-ons empty state */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center' }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                background: 'rgba(108,99,255,0.1)',
                border: '1px solid rgba(108,99,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                mx: 'auto',
                mb: 3,
              }}
            >
              🔜
            </Box>
            <Typography
              component="p"
              sx={{
                color: '#6C63FF',
                fontWeight: 600,
                fontSize: '0.78rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                mb: 1.5,
              }}
            >
              Add-Ons
            </Typography>
            <Typography variant="h4" sx={{ color: 'white', mb: 1.5, fontSize: '1.4rem' }}>
              No optional add-ons available yet
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', mb: 3, fontSize: '0.9rem' }}>
              We are preparing branch migration bundles and priority support packs.
              Core licensing remains fully available today.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.65)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.9)',
                  },
                }}
              >
                Join Waitlist
              </Button>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Button
                  variant="text"
                  sx={{
                    color: 'rgba(255,255,255,0.4)',
                    '&:hover': { color: 'rgba(255,255,255,0.7)' },
                  }}
                >
                  ← Back to Overview
                </Button>
              </Link>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <CtaSection />
    </Box>
  );
}
