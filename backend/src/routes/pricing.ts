import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/pricing — public, returns active pricing plans
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
    return;
  }

  res.json(data);
});

export default router;
