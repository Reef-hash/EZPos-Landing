'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faDesktop,
  faMobileScreen,
  faGlobe,
  faClock,
  faShieldHalved,
  faScrewdriverWrench,
} from '@fortawesome/free-solid-svg-icons';
import { getProductLinks } from '@/lib/links';

const ezposFeatures = [
  'Lifetime desktop license (one device)',
  'Offline sales and inventory operations',
  'Barcode and receipt printer support',
  'Sales reporting and audit history',
  'Manual key generation via admin panel',
  'License validation and device binding',
];

const crossxBasicFeatures = [
  '1 restaurant license (365 days)',
  'Table and kitchen order workflow',
  'Menu and category management',
  'Offline-first architecture',
  'Mobile-ready operations',
];

const crossxProFeatures = [
  '1 restaurant license (730 days)',
  'Everything in Basic included',
  'Advanced reporting and exports',
  'Expanded operational limits',
  'Priority support queue',
];

function FeatureList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map((item) => (
        <Box key={item} component="li" sx={{ display: 'flex', gap: 1.2, mb: 1.4, alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              mt: 0.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${accent}22`,
              border: `1px solid ${accent}66`,
            }}
          >
            <FontAwesomeIcon icon={faCheck} style={{ fontSize: 10, color: accent }} />
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.74)', lineHeight: 1.65, fontSize: '0.92rem' }}>
            {item}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function PriceCard({
  title,
  subtitle,
  price,
  period,
  accent,
  ctaLabel,
  ctaHref,
  features,
}: {
  title: string;
  subtitle: string;
  price: string;
  period: string;
  accent: string;
  ctaLabel: string;
  ctaHref: string;
  features: string[];
}) {
  return (
    <Box
      sx={{
        background: 'rgba(18,18,26,0.82)',
        border: `1px solid ${accent}55`,
        borderRadius: 3,
        p: 3.2,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 420,
      }}
    >
      <Typography sx={{ color: accent, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.56)', mb: 2.2, minHeight: 44 }}>{subtitle}</Typography>

      <Box sx={{ mb: 2.4 }}>
        <Typography sx={{ color: 'white', fontSize: '2.1rem', fontWeight: 800, lineHeight: 1 }}>
          {price}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.48)', fontSize: '0.86rem', mt: 0.5 }}>{period}</Typography>
      </Box>

      <Box sx={{ mb: 2.5, flex: 1 }}>
        <FeatureList items={features} accent={accent} />
      </Box>

      <Link href={ctaHref} style={{ textDecoration: 'none' }}>
        <Button
          variant="contained"
          fullWidth
          sx={{
            background: accent,
            color: '#111',
            py: 1.3,
            fontWeight: 700,
            '&:hover': { background: accent, filter: 'brightness(0.92)' },
          }}
        >
          {ctaLabel}
        </Button>
      </Link>
    </Box>
  );
}

export default function PricingPage() {
  const links = getProductLinks();

  return (
    <Box sx={{ background: '#09090E', minHeight: '100vh' }}>
      <Box
        sx={{
          pt: { xs: 15, md: 17 },
          pb: { xs: 8, md: 10 },
          textAlign: 'center',
          background: 'linear-gradient(180deg, #09090E 0%, #0E0E18 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Container maxWidth="md">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Typography sx={{ color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.11em', fontWeight: 700, fontSize: '0.78rem', mb: 1.1 }}>
              Pricing and Licensing
            </Typography>
            <Typography variant="h1" sx={{ color: 'white', mb: 1.7, fontSize: { xs: '2rem', md: '2.9rem' } }}>
              Complete pricing flow for both products
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.58)', maxWidth: 580, mx: 'auto' }}>
              EZPos for retail desktop operations and CrossxPos for restaurant operations. Each product has independent pricing and license behavior.
            </Typography>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 } }}>
        <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <FontAwesomeIcon icon={faDesktop} style={{ color: '#F59E0B' }} />
          <Typography variant="h3" sx={{ color: 'white', fontSize: { xs: '1.5rem', md: '2rem' } }}>
            EZPos Desktop
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.8, mb: 8 }}>
          <PriceCard
            title="EZPos Professional"
            subtitle="Retail-focused desktop POS license for single deployment."
            price="RM499"
            period="One-time payment · Lifetime access"
            accent="#F59E0B"
            ctaLabel="Buy EZPos License"
            ctaHref={links.ezposPricing}
            features={ezposFeatures}
          />

          <Box
            sx={{
              background: 'rgba(18,18,26,0.72)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              p: 3.2,
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 700, mb: 2 }}>EZPos License Notes</Typography>
            <Box sx={{ display: 'grid', gap: 1.4 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.65)' }}>
                <FontAwesomeIcon icon={faClock} style={{ marginRight: 8, color: '#F59E0B' }} />
                Lifetime product use after activation.
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.65)' }}>
                <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 8, color: '#F59E0B' }} />
                Device binding protects license from unauthorized reuse.
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.65)' }}>
                <FontAwesomeIcon icon={faScrewdriverWrench} style={{ marginRight: 8, color: '#F59E0B' }} />
                Admin can reset devices and issue manual keys for cash sales.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <FontAwesomeIcon icon={faMobileScreen} style={{ color: '#818CF8' }} />
          <Typography variant="h3" sx={{ color: 'white', fontSize: { xs: '1.5rem', md: '2rem' } }}>
            CrossxPos Restaurant
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.8, mb: 4.5 }}>
          <PriceCard
            title="CrossxPos Basic"
            subtitle="Core restaurant flow for table, order, and daily operation."
            price="RM299"
            period="Per license · 365 days"
            accent="#818CF8"
            ctaLabel="Buy CrossxPos Basic"
            ctaHref={links.crossxPricing}
            features={crossxBasicFeatures}
          />

          <PriceCard
            title="CrossxPos Pro"
            subtitle="Extended duration and higher operational ceiling for scaling outlets."
            price="RM499"
            period="Per license · 730 days"
            accent="#A78BFA"
            ctaLabel="Buy CrossxPos Pro"
            ctaHref={links.crossxPricing}
            features={crossxProFeatures}
          />
        </Box>

        <Box
          sx={{
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 3,
            p: 3,
            background: 'rgba(14,14,22,0.75)',
          }}
        >
          <Typography sx={{ color: 'white', fontWeight: 700, mb: 2.2 }}>
            CrossxPos platform summary
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 1.6 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.65)' }}>
              <FontAwesomeIcon icon={faMobileScreen} style={{ marginRight: 8, color: '#818CF8' }} />
              Android and iOS support
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.65)' }}>
              <FontAwesomeIcon icon={faGlobe} style={{ marginRight: 8, color: '#818CF8' }} />
              Browser-based PWA operation
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.65)' }}>
              <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 8, color: '#818CF8' }} />
              Signed key validation workflow
            </Typography>
          </Box>
        </Box>
      </Container>

      <Box sx={{ py: 8, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Container maxWidth="sm">
          <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.4rem', mb: 1.2 }}>
            Need administrator access?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.58)', mb: 2.3 }}>
            Manage generated keys, manual cash licenses, and device resets from the admin panel.
          </Typography>
          <Link href={links.adminLogin} style={{ textDecoration: 'none' }}>
            <Button variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.22)', color: 'white', px: 3.5, py: 1.2 }}>
              Open Admin Login
            </Button>
          </Link>
        </Container>
      </Box>
    </Box>
  );
}
