import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function AdminPage() {
  const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
  const adminUrl = backendBase ? `${backendBase}/Admin/Login` : '';

  return (
    <Box sx={{ minHeight: '100vh', background: '#09090E', pt: { xs: 16, md: 18 }, pb: 8 }}>
      <Container maxWidth="sm">
        <Box
          sx={{
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
            p: 4,
            background: 'rgba(18,18,26,0.78)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ color: 'white', mb: 1.5 }}>
            Admin Access
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
            Admin panel is hosted on backend service. Use the button below to open login.
          </Typography>

          {adminUrl ? (
            <Link href={adminUrl} style={{ textDecoration: 'none' }}>
              <Button variant="contained" sx={{ background: '#6C63FF', px: 3.5, py: 1.2 }}>
                Open Admin Login
              </Button>
            </Link>
          ) : (
            <>
              <Typography sx={{ color: '#f59e0b', mb: 1.4, fontSize: '0.92rem' }}>
                NEXT_PUBLIC_BACKEND_URL is not configured in Vercel.
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.52)', fontSize: '0.86rem' }}>
                Set it to your Render backend domain, for example: https://your-backend.onrender.com
              </Typography>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
