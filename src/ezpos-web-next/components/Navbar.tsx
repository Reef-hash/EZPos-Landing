'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import useScrollTrigger from '@mui/material/useScrollTrigger';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Features', href: '/#features' },
  { label: 'Contact', href: '/#contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 40 });

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: scrolled
            ? 'rgba(10, 10, 15, 0.92)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1.5, maxWidth: 1280, width: '100%', mx: 'auto', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6C63FF 0%, #8A84FF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(108,99,255,0.4)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                EZ
              </Box>
              <Typography
                variant="h6"
                sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}
              >
                EZPos
              </Typography>
            </motion.div>
          </Link>

          {/* Desktop Nav Links */}
          <Box
            component="nav"
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 0.5,
              alignItems: 'center',
            }}
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
              >
                <Link href={link.href} style={{ textDecoration: 'none' }}>
                  <Button
                    sx={{
                      color: 'rgba(255,255,255,0.75)',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      px: 2,
                      '&:hover': {
                        color: 'white',
                        background: 'rgba(255,255,255,0.06)',
                      },
                    }}
                  >
                    {link.label}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </Box>

          {/* CTA + Mobile Menu Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/pricing" style={{ textDecoration: 'none' }}>
                <Button
                  variant="contained"
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    background: 'linear-gradient(135deg, #6C63FF 0%, #8A84FF 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a52e0 0%, #7b75f5 100%)',
                    },
                  }}
                >
                  Get License
                </Button>
              </Link>
            </motion.div>

            {/* Hamburger */}
            <IconButton
              aria-label="open navigation menu"
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { xs: 'flex', md: 'none' },
                color: 'white',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                p: '6px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="5" width="18" height="2" rx="1"/>
                <rect x="3" y="11" width="18" height="2" rx="1"/>
                <rect x="3" y="17" width="18" height="2" rx="1"/>
              </svg>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              background: '#12121A',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              px: 2,
              pt: 3,
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
            Menu
          </Typography>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </IconButton>
        </Box>
        <List>
          {navLinks.map((link) => (
            <ListItem key={link.href} disablePadding>
              <Link href={link.href} style={{ textDecoration: 'none', width: '100%' }} onClick={() => setMobileOpen(false)}>
                <ListItemButton sx={{ borderRadius: 2, mb: 0.5 }}>
                  <ListItemText
                    primary={link.label}
                    sx={{ '& .MuiListItemText-primary': { color: 'rgba(255,255,255,0.85)', fontWeight: 500 } }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          ))}
        </List>
        <Box sx={{ px: 1, mt: 2 }}>
          <Link href="/pricing" style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
            <Button
              variant="contained"
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #8A84FF 100%)',
                py: 1.5,
              }}
            >
              Get License
            </Button>
          </Link>
        </Box>
      </Drawer>
    </>
  );
}
