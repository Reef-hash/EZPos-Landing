import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/licenses — public: verify a license key
router.get('/verify/:key', async (req: Request, res: Response) => {
  const { key } = req.params;

  const { data, error } = await supabase
    .from('licenses')
    .select('key, product, plan_name, expires_at, is_active, customer_name')
    .eq('key', key)
    .single();

  if (error || !data) {
    res.status(404).json({ valid: false, error: 'License key not found' });
    return;
  }

  const expired = new Date(data.expires_at) < new Date();
  res.json({
    valid: data.is_active && !expired,
    product: data.product,
    plan: data.plan_name,
    expiresAt: data.expires_at,
    customerName: data.customer_name,
    expired,
  });
});

export default router;
