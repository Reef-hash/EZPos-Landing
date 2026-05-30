import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const PRODUCT_LABELS: Record<'ezpos' | 'crossxpos', string> = {
  ezpos: 'EZPos Desktop',
  crossxpos: 'CrossxPos',
};

// All admin routes require JWT
router.use(requireAdmin);

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

// GET /api/admin/dashboard — business overview stats
router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  const [licensesRes, salesRes, plansRes] = await Promise.all([
    supabase.from('licenses').select('id, product, is_active, created_at'),
    supabase.from('sales').select('amount_myr, product, paid_at'),
    supabase.from('pricing_plans').select('id').eq('is_active', true),
  ]);

  const licenses = licensesRes.data ?? [];
  const sales = salesRes.data ?? [];

  const totalRevenue = sales.reduce((sum, s) => sum + (s.amount_myr ?? 0), 0);
  const thisMonth = new Date();
  thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);

  const monthlyRevenue = sales
    .filter(s => new Date(s.paid_at) >= thisMonth)
    .reduce((sum, s) => sum + (s.amount_myr ?? 0), 0);

  res.json({
    totalLicenses: licenses.length,
    activeLicenses: licenses.filter(l => l.is_active).length,
    totalRevenue,
    monthlyRevenue,
    totalSales: sales.length,
    ezposLicenses: licenses.filter(l => l.product === 'ezpos').length,
    crossxposLicenses: licenses.filter(l => l.product === 'crossxpos').length,
    activePricingPlans: plansRes.data?.length ?? 0,
  });
});

// ─── LICENSES ────────────────────────────────────────────────────────────────

router.get('/licenses', async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: 'Failed to fetch licenses' }); return; }
  res.json(data);
});

router.patch('/licenses/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { is_active, expires_at } = req.body;

  const { data, error } = await supabase
    .from('licenses')
    .update({ is_active, expires_at })
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: 'Failed to update license' }); return; }
  res.json(data);
});

router.delete('/licenses/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('licenses').delete().eq('id', id);
  if (error) { res.status(500).json({ error: 'Failed to delete license' }); return; }
  res.json({ success: true });
});

// ─── PRICING PLANS ───────────────────────────────────────────────────────────

const planSchema = z.object({
  product: z.enum(['ezpos', 'crossxpos']),
  name: z.string().min(1),
  description: z.string(),
  price_myr: z.number().positive(),
  duration_days: z.number().int().positive(),
  features: z.array(z.string()),
  is_active: z.boolean(),
  sort_order: z.number().int(),
  is_popular: z.boolean().optional(),
});

router.get('/pricing', async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) { res.status(500).json({ error: 'Failed to fetch plans' }); return; }
  res.json(data);
});

router.post('/pricing', async (req: AuthRequest, res: Response) => {
  const parsed = planSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const payload = {
    ...parsed.data,
    product_label: PRODUCT_LABELS[parsed.data.product],
  };

  const { data, error } = await supabase
    .from('pricing_plans')
    .insert(payload)
    .select()
    .single();

  if (error) { res.status(500).json({ error: 'Failed to create plan' }); return; }
  res.status(201).json(data);
});

router.put('/pricing/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const parsed = planSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const payload = {
    ...parsed.data,
    ...(parsed.data.product ? { product_label: PRODUCT_LABELS[parsed.data.product] } : {}),
  };

  const { data, error } = await supabase
    .from('pricing_plans')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: 'Failed to update plan' }); return; }
  res.json(data);
});

router.delete('/pricing/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('pricing_plans').delete().eq('id', id);
  if (error) { res.status(500).json({ error: 'Failed to delete plan' }); return; }
  res.json({ success: true });
});

// ─── ADD-ONS ─────────────────────────────────────────────────────────────────

const addonSchema = z.object({
  product: z.enum(['ezpos', 'crossxpos', 'all']),
  name: z.string().min(1),
  description: z.string().default(''),
  image_url: z.string().url().optional().or(z.literal('')),
  price_myr: z.number().positive(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

router.get('/addons', async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('addons')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { res.status(500).json({ error: 'Failed to fetch add-ons' }); return; }
  res.json(data);
});

router.post('/addons', async (req: AuthRequest, res: Response) => {
  const parsed = addonSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { data, error } = await supabase.from('addons').insert(parsed.data).select().single();
  if (error) { res.status(500).json({ error: 'Failed to create add-on' }); return; }
  res.status(201).json(data);
});

router.put('/addons/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const parsed = addonSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { data, error } = await supabase.from('addons').update(parsed.data).eq('id', id).select().single();
  if (error) { res.status(500).json({ error: 'Failed to update add-on' }); return; }
  res.json(data);
});

router.delete('/addons/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('addons').delete().eq('id', id);
  if (error) { res.status(500).json({ error: 'Failed to delete add-on' }); return; }
  res.json({ success: true });
});

// ─── SALES ───────────────────────────────────────────────────────────────────

router.get('/sales', async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('paid_at', { ascending: false });

  if (error) { res.status(500).json({ error: 'Failed to fetch sales' }); return; }
  res.json(data);
});

export default router;
