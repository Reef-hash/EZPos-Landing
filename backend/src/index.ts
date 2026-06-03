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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Stripe webhooks need raw body — must be before express.json()
app.use('/api/webhook', webhookRoutes);

// JSON body parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/v1/licensing', licensingV1Routes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/addons', addonRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/v1', adminV1Routes);
app.use('/api/portal', portalRoutes);

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
