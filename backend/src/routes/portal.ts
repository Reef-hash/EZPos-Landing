import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { z } from 'zod';

const router = Router();

// ─── PORTAL AUTH MIDDLEWARE ───────────────────────────────────────────────────

export interface PortalRequest extends Request {
  customer?: { id: string; name: string; email: string };
}

async function requirePortalAuth(req: PortalRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user?.email) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('id, name, email')
    .eq('email', user.email)
    .single();

  if (custError || !customer) {
    res.status(403).json({ error: 'No account found for this email' });
    return;
  }

  req.customer = customer;
  next();
}

// ─── MAGIC LINK (send) ────────────────────────────────────────────────────────
// Note: in production the frontend calls Supabase JS directly for magic link.
// This endpoint exists for server-side send (e.g. white-label or server-rendered flow).

const magicLinkSchema = z.object({ email: z.string().email() });

router.post('/auth/magic-link', async (req: Request, res: Response) => {
  const parsed = magicLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid email required' });
    return;
  }

  const { email } = parsed.data;
  const redirectTo = process.env.PORTAL_URL
    ? `${process.env.PORTAL_URL}/portal/callback`
    : undefined;

  const { error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  });

  if (error) {
    res.status(500).json({ error: 'Failed to send magic link' });
    return;
  }

  // Never reveal whether the email exists — always return 200
  res.json({ message: 'Magic link sent if account exists' });
});

// ─── CUSTOMER PORTAL ROUTES (auth required) ───────────────────────────────────

// GET /api/portal/me — list all entitlements + license keys for authenticated customer
router.get('/me', requirePortalAuth, async (req: PortalRequest, res: Response) => {
  const customerId = req.customer!.id;

  const { data, error } = await supabase
    .from('entitlements')
    .select(`
      id, status, expires_at, starts_at,
      plans ( code, name, products ( code, name ) ),
      license_credentials ( license_key, status, issued_at ),
      activations ( id, device_id, status, last_validated_at ),
      subscriptions ( id, provider, status, current_period_start, current_period_end, canceled_at )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: 'Failed to load entitlements' }); return; }

  const result = (data ?? []).map((ent: any) => {
    const activeSub = (ent.subscriptions ?? []).find((s: any) => s.status !== 'canceled') ?? null;
    return {
      entitlement_id: ent.id,
      entitlement_status: ent.status,
      expires_at: ent.expires_at,
      starts_at: ent.starts_at,
      product: ent.plans?.products?.code,
      product_name: ent.plans?.products?.name,
      plan_code: ent.plans?.code,
      plan_name: ent.plans?.name,
      license_key: ent.license_credentials?.[0]?.license_key ?? null,
      credential_status: ent.license_credentials?.[0]?.status ?? null,
      issued_at: ent.license_credentials?.[0]?.issued_at ?? null,
      active_activations: (ent.activations ?? []).filter((a: any) => a.status === 'active').length,
      total_activations: (ent.activations ?? []).length,
      subscription: activeSub ? {
        id: activeSub.id,
        provider: activeSub.provider,
        status: activeSub.status,
        current_period_start: activeSub.current_period_start,
        current_period_end: activeSub.current_period_end,
        canceled_at: activeSub.canceled_at,
      } : null,
    };
  });

  res.json({ customer: req.customer, entitlements: result });
});

// GET /api/portal/license/:key — detail for one license (must belong to this customer)
router.get('/license/:key', requirePortalAuth, async (req: PortalRequest, res: Response) => {
  const { key } = req.params;
  const customerId = req.customer!.id;

  const { data: cred, error } = await supabase
    .from('license_credentials')
    .select(`
      id, license_key, status, issued_at,
      entitlements (
        id, status, expires_at, starts_at, customer_id,
        plans ( code, name, products ( code, name ) ),
        activations ( id, device_id, status, first_activated_at, last_validated_at ),
        subscriptions ( id, provider, status, current_period_start, current_period_end, canceled_at )
      )
    `)
    .eq('license_key', key)
    .single();

  if (error || !cred) { res.status(404).json({ error: 'License not found' }); return; }

  const ent = (cred as any).entitlements;

  // Ownership check — entitlement must belong to the authenticated customer
  if (ent?.customer_id !== customerId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  res.json({
    license_key: cred.license_key,
    credential_status: cred.status,
    issued_at: cred.issued_at,
    entitlement: {
      id: ent.id,
      status: ent.status,
      expires_at: ent.expires_at,
      starts_at: ent.starts_at,
      product: ent.plans?.products?.code,
      product_name: ent.plans?.products?.name,
      plan_code: ent.plans?.code,
      plan_name: ent.plans?.name,
    },
    subscription: (() => {
      const activeSub = (ent.subscriptions ?? []).find((s: any) => s.status !== 'canceled') ?? null;
      return activeSub ? {
        id: activeSub.id,
        provider: activeSub.provider,
        status: activeSub.status,
        current_period_start: activeSub.current_period_start,
        current_period_end: activeSub.current_period_end,
        canceled_at: activeSub.canceled_at,
      } : null;
    })(),
    activations: (ent.activations ?? []).map((a: any) => ({
      id: a.id,
      device_id: a.device_id,
      status: a.status,
      first_activated_at: a.first_activated_at,
      last_validated_at: a.last_validated_at,
    })),
  });
});

// POST /api/portal/transfer-request — request device transfer
const transferSchema = z.object({
  license_key: z.string().min(1),
  reason: z.string().min(1).max(500),
});

router.post('/transfer-request', requirePortalAuth, async (req: PortalRequest, res: Response) => {
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'license_key and reason are required' });
    return;
  }

  const { license_key, reason } = parsed.data;
  const customerId = req.customer!.id;

  // Verify ownership
  const { data: cred } = await supabase
    .from('license_credentials')
    .select('entitlement_id, entitlements(customer_id, activations(id, status))')
    .eq('license_key', license_key)
    .single();

  if (!cred) { res.status(404).json({ error: 'License not found' }); return; }

  const ent = (cred as any).entitlements;
  if (ent?.customer_id !== customerId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const activeActivation = (ent?.activations ?? []).find((a: any) => a.status === 'active');

  const { data: transferReq, error } = await supabase
    .from('transfer_requests')
    .insert({
      entitlement_id: cred.entitlement_id,
      from_activation_id: activeActivation?.id ?? null,
      status: 'requested',
      requested_by: req.customer!.email,
      reason,
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: 'Failed to create transfer request' }); return; }

  await supabase.from('audit_events').insert({
    actor_type: 'customer',
    actor_id: req.customer!.email,
    action: 'transfer_request.create',
    entity_type: 'entitlement',
    entity_id: cred.entitlement_id,
    payload_json: { reason, transfer_request_id: transferReq.id },
  });

  res.json({ success: true, transfer_request_id: transferReq.id });
});

export default router;
