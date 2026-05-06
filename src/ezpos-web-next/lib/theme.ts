'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6C63FF',
      light: '#8A84FF',
      dark: '#4A42E8',
    },
    secondary: {
      main: '#FF6B6B',
      light: '#FF8E8E',
      dark: '#E84A4A',
    },
    background: {
      default: '#0A0A0F',
      paper: '#12121A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255,255,255,0.65)',
    },
    divider: 'rgba(255,255,255,0.08)',
    success: {
      main: '#4ECDC4',
    },
    error: {
      main: '#FF6B6B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
    },
    h2: {
      fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontSize: 'clamp(1.2rem, 2vw, 1.6rem)',
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.9rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.95rem',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0 4px 20px rgba(108, 99, 255, 0.35)',
          '&:hover': {
            boxShadow: '0 6px 28px rgba(108, 99, 255, 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#12121A',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#6C63FF #0A0A0F',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: '#0A0A0F',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#6C63FF',
            borderRadius: 3,
          },
        },
      },
    },
  },
});
