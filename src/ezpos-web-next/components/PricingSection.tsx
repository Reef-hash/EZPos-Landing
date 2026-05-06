'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

interface PricingCardProps {
  planName: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  isFeatured?: boolean;
  actionText: string;
  actionHref: string;
  index: number;
  inView: boolean;
}

function PricingCard({
  planName,
  description,
  price,
  period,
  features,
  isFeatured,
  actionText,
  actionHref,
  index,
  inView,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ flex: 1 }}
    >
      <Box
        sx={{
          background: isFeatured
            ? 'linear-gradient(135deg, rgba(108,99,255,0.12) 0%, rgba(18,18,26,0.95) 100%)'
            : 'rgba(18,18,26,0.7)',
          border: isFeatured
            ? '1px solid rgba(108,99,255,0.4)'
            : '1px solid rgba(255,255,255,0.07)',
          borderRadius: 4,
          p: { xs: 3.5, md: 4 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          boxShadow: isFeatured ? '0 0 60px rgba(108,99,255,0.12)' : 'none',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: isFeatured
              ? '0 20px 60px rgba(108,99,255,0.22)'
              : '0 16px 40px rgba(0,0,0,0.35)',
          },
        }}
      >
        {isFeatured && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'linear-gradient(135deg, #6C63FF, #8A84FF)',
              px: 2,
              py: 0.7,
              borderBottomLeftRadius: 12,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Recommended
          </Box>
        )}

        <Typography
          variant="h5"
          sx={{ color: 'white', fontWeight: 700, mb: 0.8, fontSize: '1.15rem' }}
        >
          {planName}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', mb: 3 }}>
          {description}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography
            component="span"
            sx={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: 800,
              color: isFeatured ? '#8A84FF' : 'white',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {price}
          </Typography>
          {period && (
            <Typography
              component="span"
              sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', ml: 1 }}
            >
              {period}
            </Typography>
          )}
        </Box>

        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 'auto', flex: 1 }}>
          {features.map((f) => (
            <Box
              component="li"
              key={f}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.4 }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: isFeatured
                    ? 'rgba(108,99,255,0.15)'
                    : 'rgba(78,205,196,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.65rem',
                  color: isFeatured ? '#8A84FF' : '#4ECDC4',
                }}
              >
                ✓
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' }}>
                {f}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Link href={actionHref} style={{ textDecoration: 'none', display: 'block' }}>
            <Button
              variant={isFeatured ? 'contained' : 'outlined'}
              fullWidth
              sx={
                isFeatured
                  ? {
                      background: 'linear-gradient(135deg, #6C63FF 0%, #8A84FF 100%)',
                      py: 1.5,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a52e0 0%, #7b75f5 100%)',
                        transform: 'translateY(-1px)',
                      },
                    }
                  : {
                      py: 1.5,
                      borderColor: 'rgba(255,255,255,0.18)',
                      color: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.35)',
                        background: 'rgba(255,255,255,0.04)',
                      },
                    }
              }
            >
              {actionText}
            </Button>
          </Link>
        </Box>
      </Box>
    </motion.div>
  );
}

const proFeatures = [
  'One-time license — no subscriptions',
  'Secure activation workflow',
  'Validation API integration',
  'Modern customer-facing UX',
  'Future customer portal ready',
  '12 months of updates',
];

const enterpriseFeatures = [
  'Multi-location support',
  'Centralized admin controls',
  'Customer portal integration',
  'Volume-friendly licensing',
  'Priority support',
  'Roadmap aligned',
];

export default function PricingSection({ showHeader = true }: { showHeader?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <Box
      id="pricing"
      component="section"
      ref={ref}
      sx={{
        py: { xs: showHeader ? 10 : 4, md: showHeader ? 14 : 6 },
        background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0D1A 50%, #0A0A0F 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background accent */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        {showHeader && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '56px' }}
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
          <Typography variant="h2" sx={{ color: 'white', mb: 2 }}>
            Simple, transparent plans
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', maxWidth: 480, mx: 'auto' }}>
            Designed for one-time purchases now, structured for subscription tiers later.
          </Typography>
        </motion.div>
        )}

        {/* Cards */}
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'flex-start' },
            justifyContent: 'center',
            maxWidth: 800,
            mx: 'auto',
          }}
        >
          <PricingCard
            planName="Professional License"
            description="For single business deployment"
            price="$199"
            period="one-time"
            isFeatured
            features={proFeatures}
            actionText="Buy License"
            actionHref="#"
            index={0}
            inView={inView}
          />
          <PricingCard
            planName="Multi-Branch Pack"
            description="Planned tier for multi-location rollouts"
            price="Coming Soon"
            period="future tier"
            features={enterpriseFeatures}
            actionText="Join Waitlist"
            actionHref="#"
            index={1}
            inView={inView}
          />
        </Box>

        {/* Trust note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ textAlign: 'center', marginTop: '40px' }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
            🔒 Secure payment processing · No hidden fees · Lifetime updates included
          </Typography>
        </motion.div>
      </Container>
    </Box>
  );
}
