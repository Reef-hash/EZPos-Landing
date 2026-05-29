'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop, faUtensils, faLock } from '@fortawesome/free-solid-svg-icons';
import { getProductLinks } from '@/lib/links';

export default function PricingSection({ showHeader = true }: { showHeader?: boolean }) {
  const links = getProductLinks();

  return (
    <Box id="pricing" component="section" sx={{ py: { xs: 9, md: 12 }, background: '#09090E' }}>
      <Container maxWidth="lg">
        {showHeader && (
          <Box sx={{ textAlign: 'center', mb: 4.5 }}>
            <Typography
              component="p"
              sx={{
                color: '#6C63FF',
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                mb: 1.2,
              }}
            >
              Pricing Snapshot
            </Typography>
            <Typography variant="h2" sx={{ color: 'white', mb: 1.2 }}>
              Two products, separate licensing
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.55)' }}>
              Retail and restaurant flows are independent, with different pricing and key behavior.
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid rgba(245,158,11,0.3)',
              background: 'rgba(245,158,11,0.08)',
            }}
          >
            <Typography sx={{ color: '#F59E0B', fontWeight: 700, mb: 1 }}>
              <FontAwesomeIcon icon={faDesktop} style={{ marginRight: 8 }} />EZPos Desktop
            </Typography>
            <Typography sx={{ color: 'white', fontSize: '1.9rem', fontWeight: 800, mb: 0.6 }}>RM499</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.58)', mb: 2.4 }}>One-time payment, lifetime license</Typography>
            <Link href={links.ezposPricing} style={{ textDecoration: 'none' }}>
              <Button variant="contained" sx={{ background: '#F59E0B', color: '#111' }}>
                Buy EZPos
              </Button>
            </Link>
          </Box>

          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid rgba(129,140,248,0.3)',
              background: 'rgba(129,140,248,0.08)',
            }}
          >
            <Typography sx={{ color: '#818CF8', fontWeight: 700, mb: 1 }}>
              <FontAwesomeIcon icon={faUtensils} style={{ marginRight: 8 }} />CrossxPos Restaurant
            </Typography>
            <Typography sx={{ color: 'white', fontSize: '1.9rem', fontWeight: 800, mb: 0.6 }}>RM299 / RM499</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.58)', mb: 2.4 }}>Basic 365 days, Pro 730 days</Typography>
            <Link href={links.crossxPricing} style={{ textDecoration: 'none' }}>
              <Button variant="contained" sx={{ background: '#818CF8', color: '#111' }}>
                Buy CrossxPos
              </Button>
            </Link>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3.2 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.84rem' }}>
            <FontAwesomeIcon icon={faLock} style={{ marginRight: 8 }} />
            Secure checkout and license generation handled by backend service.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
