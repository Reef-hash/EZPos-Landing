import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/addons — public list of active add-ons
router.get('/', async (req: Request, res: Response) => {
  const product = req.query.product as string | undefined;

  let query = supabase
    .from('addons')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (product === 'ezpos' || product === 'crossxpos') {
    query = query.in('product', [product, 'all']);
  }

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: 'Failed to fetch add-ons' });
    return;
  }

  res.json(data);
});

export default router;
