'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('ezpos-cookie-consent');
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('ezpos-cookie-consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('ezpos-cookie-consent', 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'calc(100% - 48px)',
            maxWidth: 560,
          }}
        >
          <Box
            sx={{
              background: 'rgba(18,18,26,0.95)',
              border: '1px solid rgba(108,99,255,0.3)',
              borderRadius: 3,
              p: 3,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 16px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{ color: 'white', fontWeight: 600, fontSize: '0.92rem', mb: 0.5 }}
              >
                🍪 We use cookies
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                We use cookies to improve your experience on EZPos. By continuing, you agree
                to our{' '}
                <Box
                  component="a"
                  href="#"
                  sx={{ color: '#8A84FF', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Privacy Policy
                </Box>
                .
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleDecline}
                sx={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '0.8rem',
                  py: 0.7,
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.8)',
                  },
                }}
              >
                Decline
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleAccept}
                sx={{
                  background: 'linear-gradient(135deg, #6C63FF 0%, #8A84FF 100%)',
                  fontSize: '0.8rem',
                  py: 0.7,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a52e0 0%, #7b75f5 100%)',
                  },
                }}
              >
                Accept
              </Button>
            </Box>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
