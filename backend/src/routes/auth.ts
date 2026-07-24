import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import {
  logSecurityEvent, recordLoginFailure, clearLoginFailures,
  bruteforceMessage, loginFailedMessage,
} from '../lib/securityLog';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Dedicated, tighter limiter for the admin login endpoint — the global
// 100 req/15min limiter is far too loose for a single-account password gate.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please slow down and retry.' },
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const { email, password } = parsed.data;
  const ip = req.ip ?? 'unknown';

  async function reportFailure(reason: 'bad_email' | 'bad_password') {
    void logSecurityEvent({
      type: 'login_failed',
      severity: 'low',
      req,
      message: loginFailedMessage(ip, reason),
    });
    const { count, suspected } = recordLoginFailure(req);
    if (suspected) {
      void logSecurityEvent({
        type: 'login_bruteforce_suspected',
        severity: 'high',
        req,
        message: bruteforceMessage(ip, count),
        meta: { count },
      });
    }
  }

  if (email !== process.env.ADMIN_EMAIL) {
    await reportFailure('bad_email');
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH!;
  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) {
    await reportFailure('bad_password');
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  clearLoginFailures(req);
  void logSecurityEvent({
    type: 'login_success',
    severity: 'info',
    req,
    message: `${ip} logged into the admin panel.`,
  });

  const token = jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: '8h' });
  res.json({ token });
});

export default router;
