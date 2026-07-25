import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logSecurityEvent, adminProbeMessage } from '../lib/securityLog';

export interface AuthRequest extends Request {
  admin?: { email: string };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    void logSecurityEvent({
      type: 'admin_probe',
      severity: 'medium',
      req,
      message: adminProbeMessage(req.ip ?? 'unknown', req.originalUrl, 'missing_token'),
    });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] }) as { email: string };
    req.admin = payload;
    next();
  } catch {
    void logSecurityEvent({
      type: 'admin_probe',
      severity: 'medium',
      req,
      message: adminProbeMessage(req.ip ?? 'unknown', req.originalUrl, 'invalid_token'),
    });
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
