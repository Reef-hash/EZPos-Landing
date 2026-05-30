import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const { email, password } = parsed.data;

  if (email !== process.env.ADMIN_EMAIL) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH!;
  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: '8h' });
  res.json({ token });
});

export default router;
