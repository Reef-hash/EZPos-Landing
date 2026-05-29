'use client';

import { useMemo, useState } from 'react';
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
  faWifi,
  faCreditCard,
  faUtensils,
  faMobileScreen,
  faGlobe,
  faStore,
  faShop,
} from '@fortawesome/free-solid-svg-icons';

const ezposFeatures = [
  'Process sales and receipts instantly',
  'Automated inventory management',
  'Daily, weekly and monthly sales reports',
  'Receipt printer and barcode scanner support',
  'Local data storage for privacy',
  'One device, one license, lifetime access',
];

const crossxFeatures = [
  'Table management and order taking (KOT)',
  'Real-time Kitchen Display System (KDS)',
  'Cashier and order void management',
  'Menu and category management',
  'Staff access control (RBAC)',
  'Sales reports and CSV export (Pro)',
];

export default function ProductsShowcase() {
  const [activeTab, setActiveTab] = useState<'ezpos' | 'crossx'>('ezpos');
  const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

  const links = useMemo(() => {
    if (backendBase) {
      return {
        ezposPricing: `${backendBase}/Home/Pricing`,
        crossxPricing: `${backendBase}/CrossxPos/Pricing`,
        crossxLearnMore: `${backendBase}/CrossxPos/Index`,
      };
    }

    return {
      ezposPricing: '/pricing',
      crossxPricing: '/pricing',
      crossxLearnMore: '/pricing',
    };
  }, [backendBase]);

  return (
    <Box
      component="section"
      id="our-products"
      sx={{
        py: { xs: 10, md: 14 },
        background: 'linear-gradient(180deg, #09090E 0%, #0D0D16 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5.5 }}>
          <Typography
            component="p"
            sx={{
              color: '#F59E0B',
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.11em',
              textTransform: 'uppercase',
              mb: 1,
            }}
          >
            Our Products
          </Typography>
          <Typography variant="h2" sx={{ color: 'white', mb: 1.5 }}>
            Two products. Two industries.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.55)' }}>
            Select a tab to learn more about each product.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 5,
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 2,
              overflow: 'hidden',
              background: 'rgba(13,13,21,0.8)',
            }}
          >
            <Button
              onClick={() => setActiveTab('ezpos')}
              sx={{
                borderRadius: 0,
                px: 3.5,
                py: 1.2,
                color: activeTab === 'ezpos' ? '#0A0A0F' : 'rgba(255,255,255,0.7)',
                background: activeTab === 'ezpos' ? '#F59E0B' : 'transparent',
                '&:hover': {
                  background: activeTab === 'ezpos' ? '#F59E0B' : 'rgba(255,255,255,0.06)',
                },
              }}
            >
              EZPos
            </Button>
            <Button
              onClick={() => setActiveTab('crossx')}
              sx={{
                borderRadius: 0,
                px: 3.5,
                py: 1.2,
                color: activeTab === 'crossx' ? '#0A0A0F' : 'rgba(255,255,255,0.7)',
                background: activeTab === 'crossx' ? '#818CF8' : 'transparent',
                '&:hover': {
                  background: activeTab === 'crossx' ? '#818CF8' : 'rgba(255,255,255,0.06)',
                },
              }}
            >
              CrossxPos
            </Button>
          </Box>
        </Box>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 5,
              background: 'rgba(18,18,26,0.78)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              p: { xs: 3, md: 5 },
              mb: 6,
            }}
          >
            <Box>
              {activeTab === 'ezpos' ? (
                <>
                  <Typography
                    sx={{
                      display: 'inline-flex',
                      px: 1.4,
                      py: 0.4,
                      mb: 2,
                      borderRadius: 1,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#F59E0B',
                      border: '1px solid rgba(245,158,11,0.35)',
                      background: 'rgba(245,158,11,0.12)',
                    }}
                  >
                    EZPos
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white', mb: 1.6 }}>
                    Desktop POS for retail businesses
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, lineHeight: 1.75 }}>
                    Built for retail shops, boutiques, pharmacies, and businesses selling physical products. Lightweight, fast, and fully functional even without internet.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
                    <Link href={links.ezposPricing} style={{ textDecoration: 'none' }}>
                      <Button variant="contained" sx={{ background: '#F59E0B', color: '#121212' }}>
                        View EZPos Pricing
                      </Button>
                    </Link>
                    <Link href="/#features" style={{ textDecoration: 'none' }}>
                      <Button variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                        Learn More
                      </Button>
                    </Link>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ px: 1.2, py: 0.6, borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                      <FontAwesomeIcon icon={faDesktop} style={{ marginRight: 8 }} />Windows Desktop
                    </Box>
                    <Box sx={{ px: 1.2, py: 0.6, borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                      <FontAwesomeIcon icon={faWifi} style={{ marginRight: 8 }} />Fully Offline
                    </Box>
                    <Box sx={{ px: 1.2, py: 0.6, borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                      <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: 8 }} />One-time Payment
                    </Box>
                  </Box>
                </>
              ) : (
                <>
                  <Typography
                    sx={{
                      display: 'inline-flex',
                      px: 1.4,
                      py: 0.4,
                      mb: 2,
                      borderRadius: 1,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#818CF8',
                      border: '1px solid rgba(129,140,248,0.35)',
                      background: 'rgba(129,140,248,0.12)',
                    }}
                  >
                    CrossxPos
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white', mb: 1.6 }}>
                    Restaurant POS for modern F&B operations
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, lineHeight: 1.75 }}>
                    Purpose-built for restaurants, cafes, and F&B businesses. Manage tables, kitchen orders, and billing in one unified system.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
                    <Link href={links.crossxPricing} style={{ textDecoration: 'none' }}>
                      <Button variant="contained" sx={{ background: '#818CF8', color: '#121212' }}>
                        View CrossxPos Pricing
                      </Button>
                    </Link>
                    <Link href={links.crossxLearnMore} style={{ textDecoration: 'none' }}>
                      <Button variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                        Learn More
                      </Button>
                    </Link>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ px: 1.2, py: 0.6, borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                      <FontAwesomeIcon icon={faMobileScreen} style={{ marginRight: 8 }} />Android and iOS
                    </Box>
                    <Box sx={{ px: 1.2, py: 0.6, borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                      <FontAwesomeIcon icon={faGlobe} style={{ marginRight: 8 }} />Browser PWA
                    </Box>
                    <Box sx={{ px: 1.2, py: 0.6, borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                      <FontAwesomeIcon icon={faWifi} style={{ marginRight: 8 }} />Offline-first
                    </Box>
                  </Box>
                </>
              )}
            </Box>

            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {(activeTab === 'ezpos' ? ezposFeatures : crossxFeatures).map((feature) => (
                <Box
                  key={feature}
                  component="li"
                  sx={{ display: 'flex', gap: 1.2, mb: 1.8, alignItems: 'flex-start' }}
                >
                  <Box
                    sx={{
                      mt: 0.3,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background:
                        activeTab === 'ezpos'
                          ? 'rgba(245,158,11,0.14)'
                          : 'rgba(129,140,248,0.14)',
                      border:
                        activeTab === 'ezpos'
                          ? '1px solid rgba(245,158,11,0.35)'
                          : '1px solid rgba(129,140,248,0.35)',
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCheck}
                      style={{
                        fontSize: 10,
                        color: activeTab === 'ezpos' ? '#F59E0B' : '#818CF8',
                      }}
                    />
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                    {feature}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </motion.div>

        <Box
          sx={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            py: { xs: 4, md: 5 },
            mb: 5,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Typography variant="h4" sx={{ color: 'white', mb: 1.2 }}>
              Which product is right for you?
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.55)' }}>
              Pick based on your business model.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2.2,
            }}
          >
            <Link href={links.ezposPricing} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid rgba(245,158,11,0.22)',
                  background: 'rgba(245,158,11,0.06)',
                  transition: 'transform .2s ease, border-color .2s ease',
                  '&:hover': { transform: 'translateY(-3px)', borderColor: '#F59E0B' },
                }}
              >
                <Box sx={{ color: '#F59E0B', mb: 1.2 }}>
                  <FontAwesomeIcon icon={faShop} />
                </Box>
                <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                  I run a retail shop or product business
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.9rem' }}>
                  Convenience stores, boutiques, pharmacies, laundrettes and hardware shops.
                </Typography>
              </Box>
            </Link>

            <Link href={links.crossxPricing} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid rgba(129,140,248,0.22)',
                  background: 'rgba(129,140,248,0.06)',
                  transition: 'transform .2s ease, border-color .2s ease',
                  '&:hover': { transform: 'translateY(-3px)', borderColor: '#818CF8' },
                }}
              >
                <Box sx={{ color: '#818CF8', mb: 1.2 }}>
                  <FontAwesomeIcon icon={faUtensils} />
                </Box>
                <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                  I run a restaurant, cafe, or F&B business
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.9rem' }}>
                  Restaurants, cafes, food courts, and cloud kitchens with table and kitchen workflows.
                </Typography>
              </Box>
            </Link>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.58)', mb: 1.8 }}>
            Ready to begin? Pick a product, pay once, and start using it today.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.4, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={links.ezposPricing} style={{ textDecoration: 'none' }}>
              <Button variant="contained" sx={{ background: '#F59E0B', color: '#111' }}>
                EZPos Pricing
              </Button>
            </Link>
            <Link href={links.crossxPricing} style={{ textDecoration: 'none' }}>
              <Button variant="outlined" sx={{ borderColor: 'rgba(129,140,248,0.5)', color: '#818CF8' }}>
                CrossxPos Pricing
              </Button>
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
