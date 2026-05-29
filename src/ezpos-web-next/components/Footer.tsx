import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { getProductLinks } from '@/lib/links';

export default function Footer() {
  const year = new Date().getFullYear();
  const links = getProductLinks();
  const footerLinks = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/#our-products' },
    { label: 'EZPos Pricing', href: links.ezposPricing },
    { label: 'CrossxPos Pricing', href: links.crossxPricing },
    { label: 'Admin Login', href: links.adminLogin },
    { label: 'Features', href: '/#features' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        py: { xs: 5, md: 6 },
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: '#0A0A0F',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 3,
          }}
        >
          {/* Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6C63FF 0%, #8A84FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.8rem',
                color: 'white',
                flexShrink: 0,
              }}
            >
              EZ
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                EZPos
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem' }}>
                License Platform
              </Typography>
            </Box>
          </Box>

          {/* Links */}
          <Box
            component="nav"
            sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexWrap: 'wrap', justifyContent: 'center' }}
            aria-label="Footer navigation"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                style={{ textDecoration: 'none' }}
              >
                <Typography
                  component="span"
                  sx={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.85rem',
                    transition: 'color 0.2s',
                    '&:hover': { color: 'rgba(255,255,255,0.8)' },
                    cursor: 'pointer',
                  }}
                >
                  {link.label}
                </Typography>
              </Link>
            ))}
          </Box>

          {/* Copyright */}
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', flexShrink: 0 }}>
            © {year} EZPos
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
