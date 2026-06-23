import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import licenseRoutes from './routes/licenses';
import licensingV1Routes from './routes/licensingV1';
import pricingRoutes from './routes/pricing';
import addonRoutes from './routes/addons';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import adminV1Routes from './routes/adminV1';
import portalRoutes from './routes/portal';
import webhookRoutes from './routes/webhook';
import downloadsRoutes from './routes/downloads';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  'null', // Capacitor WebView / file:// origin (Android APK)
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  // Allow LAN IPs for dev/testing (pattern: 192.168.x.x or 10.x.x.x)
  ...(process.env.EXTRA_ORIGINS ? process.env.EXTRA_ORIGINS.split(',').map((o) => o.trim()) : []),
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman, server-to-server) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    // Allow any LAN origin in development
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Tighter rate limit for licensing endpoints (validate/activate are sensitive)
const licensingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many licensing requests. Please slow down and retry.' },
});

// Stripe webhooks need raw body — must be before express.json()
app.use('/api/webhook', webhookRoutes);

// JSON body parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/v1/licensing', licensingLimiter, licensingV1Routes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/addons', addonRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/v1', adminV1Routes);
app.use('/api/portal', portalRoutes);
app.use('/api/downloads', downloadsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`EZPos Web API running on port ${PORT}`);
});

export default app;
