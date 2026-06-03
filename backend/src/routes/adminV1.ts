import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(requireAdmin);

// ─── LICENSES LIST ───────────────────────────────────────────────────────────

// GET /api/admin/v1/licenses
router.get('/licenses', async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('license_credentials')
    .select(`
      id, license_key, status, issued_at, created_at,
      entitlements (
        id, status, expires_at,
        customers ( name, email ),
        plans ( code, name, products ( code ) ),
        activations ( id, status )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: 'Failed to fetch licenses' }); return; }

  const result = (data ?? []).map((row: any) => {
    const ent = row.entitlements;
    const activeActivations = (ent?.activations ?? []).filter((a: any) => a.status === 'active').length;
    return {
      id: row.id,
      license_key: row.license_key,
      credential_status: row.status,
      entitlement_id: ent?.id,
      entitlement_status: ent?.status,
      expires_at: ent?.expires_at,
      customer_name: ent?.customers?.name,
      customer_email: ent?.customers?.email,
      product: ent?.plans?.products?.code,
      plan_name: ent?.plans?.name,
      plan_code: ent?.plans?.code,
      active_activations: activeActivations,
      issued_at: row.issued_at,
      created_at: row.created_at,
    };
  });

  res.json(result);
});

// ─── LICENSE DETAIL ──────────────────────────────────────────────────────────

// GET /api/admin/v1/licenses/:key
router.get('/licenses/:key', async (req: AuthRequest, res: Response) => {
  const { key } = req.params;

  const { data: cred, error } = await supabase
    .from('license_credentials')
    .select(`
      id, license_key, status, issued_at, revoked_at, created_at,
      entitlements (
        id, status, expires_at, starts_at, metadata_json,
        customers ( id, name, email, phone ),
        plans ( code, name, billing_model, products ( code, name ) )
      )
    `)
    .eq('license_key', key)
    .single();

  if (error || !cred) { res.status(404).json({ error: 'License not found' }); return; }

  const ent = (cred as any).entitlements;

  const [activationsRes, validationRes, auditRes] = await Promise.all([
    supabase
      .from('activations')
      .select('id, device_id, installation_id, status, first_activated_at, last_validated_at, created_at')
      .eq('entitlement_id', ent.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('validation_events')
      .select('id, decision, status, reason_code, client_action, request_ip, created_at')
      .eq('entitlement_id', ent.id)
      .order('created_at', { ascending: false })
      .limit(30),

    supabase
      .from('audit_events')
      .select('id, actor_type, actor_id, action, payload_json, created_at')
      .eq('entity_type', 'entitlement')
      .eq('entity_id', ent.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  res.json({
    id: cred.id,
    license_key: cred.license_key,
    credential_status: cred.status,
    issued_at: cred.issued_at,
    revoked_at: (cred as any).revoked_at,
    entitlement: {
      id: ent.id,
      status: ent.status,
      expires_at: ent.expires_at,
      starts_at: ent.starts_at,
      customer: ent.customers,
      product: ent.plans?.products?.code,
      product_name: ent.plans?.products?.name,
      plan_code: ent.plans?.code,
      plan_name: ent.plans?.name,
      billing_model: ent.plans?.billing_model,
    },
    activations: activationsRes.data ?? [],
    validation_events: validationRes.data ?? [],
    audit_events: auditRes.data ?? [],
  });
});

// ─── ACTIVATION MANAGEMENT ───────────────────────────────────────────────────

// POST /api/admin/v1/activations/:id/revoke
router.post('/activations/:id/revoke', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('activations')
    .update({ status: 'released', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) { res.status(500).json({ error: 'Failed to revoke activation' }); return; }

  await supabase.from('audit_events').insert({
    actor_type: 'admin',
    actor_id: req.admin?.email ?? 'unknown',
    action: 'activation.revoke',
    entity_type: 'activation',
    entity_id: id,
    payload_json: { revoked_by: req.admin?.email },
  });

  res.json({ success: true });
});

// ─── ENTITLEMENT MANAGEMENT ──────────────────────────────────────────────────

const suspendSchema = z.object({ reason: z.string().optional() });

// POST /api/admin/v1/entitlements/:id/suspend
router.post('/entitlements/:id/suspend', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const parsed = suspendSchema.safeParse(req.body);
  const reason = parsed.success ? (parsed.data.reason ?? '') : '';

  const { error } = await supabase
    .from('entitlements')
    .update({ status: 'suspended', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) { res.status(500).json({ error: 'Failed to suspend entitlement' }); return; }

  await supabase.from('audit_events').insert({
    actor_type: 'admin',
    actor_id: req.admin?.email ?? 'unknown',
    action: 'entitlement.suspend',
    entity_type: 'entitlement',
    entity_id: id,
    payload_json: { reason, suspended_by: req.admin?.email },
  });

  res.json({ success: true });
});

// POST /api/admin/v1/entitlements/:id/reinstate
router.post('/entitlements/:id/reinstate', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('entitlements')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) { res.status(500).json({ error: 'Failed to reinstate entitlement' }); return; }

  await supabase.from('audit_events').insert({
    actor_type: 'admin',
    actor_id: req.admin?.email ?? 'unknown',
    action: 'entitlement.reinstate',
    entity_type: 'entitlement',
    entity_id: id,
    payload_json: { reinstated_by: req.admin?.email },
  });

  res.json({ success: true });
});

// ─── MONITORING ──────────────────────────────────────────────────────────────

// GET /api/admin/v1/monitoring/stats
router.get('/monitoring/stats', async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const last7 = new Date(now); last7.setDate(now.getDate() - 7);
  const last30 = new Date(now); last30.setDate(now.getDate() - 30);

  const [todayRes, last7Res, last30Res, reasonRes, recentDenyRes] = await Promise.all([
    supabase.from('validation_events').select('decision').gte('created_at', today.toISOString()),
    supabase.from('validation_events').select('decision').gte('created_at', last7.toISOString()),
    supabase.from('validation_events').select('decision').gte('created_at', last30.toISOString()),
    supabase.from('validation_events').select('reason_code, decision').gte('created_at', last30.toISOString()),
    supabase
      .from('validation_events')
      .select('reason_code, created_at')
      .eq('decision', 'deny')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  function calcStats(rows: { decision: string }[]) {
    const total = rows.length;
    const allow = rows.filter(r => r.decision === 'allow' || r.decision === 'allow_temporarily').length;
    const deny = rows.filter(r => r.decision === 'deny').length;
    return { total, allow, deny, successRate: total > 0 ? Math.round((allow / total) * 100) : 0 };
  }

  const reasonMap: Record<string, number> = {};
  (reasonRes.data ?? []).forEach((r: any) => {
    reasonMap[r.reason_code] = (reasonMap[r.reason_code] ?? 0) + 1;
  });
  const topReasonCodes = Object.entries(reasonMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([code, count]) => ({ code, count }));

  res.json({
    today: calcStats(todayRes.data ?? []),
    last7days: calcStats(last7Res.data ?? []),
    last30days: calcStats(last30Res.data ?? []),
    topReasonCodes,
    recentDenials: recentDenyRes.data ?? [],
  });
});

export default router;
