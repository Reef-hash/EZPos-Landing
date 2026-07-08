import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { z } from 'zod';

const router = Router();

type ProductType = 'ezpos' | 'crossxpos' | 'ezoffice';
type ValidationStatus =
  | 'valid'
  | 'expired'
  | 'not_found'
  | 'revoked'
  | 'product_mismatch'
  | 'seat_exceeded'
  | 'device_mismatch';
type ValidationDecision = 'allow' | 'deny' | 'allow_temporarily';
type BindingMode = 'strict' | 'flexible';

type ProductPolicy = {
  bindingMode: BindingMode;
  seatLimit: number;
  graceDays: number;
  revalidateAfterHours: number;
};

// Fallback policy used only if a product's product_policy_profiles row is
// missing (should not happen in normal operation — every product must be
// onboarded with a policy row, see supabase-ezoffice-onboarding.sql for the
// pattern). Mirrors the values this file hardcoded before policy became
// DB-driven, so a missing row degrades to the old behaviour rather than a
// surprising new one.
const FALLBACK_POLICY_BY_PRODUCT: Record<ProductType, ProductPolicy> = {
  ezpos: { bindingMode: 'strict', seatLimit: 1, graceDays: 7, revalidateAfterHours: 24 },
  crossxpos: { bindingMode: 'flexible', seatLimit: 3, graceDays: 3, revalidateAfterHours: 12 },
  ezoffice: { bindingMode: 'strict', seatLimit: 1, graceDays: 75, revalidateAfterHours: 36 },
};

const validateSchema = z.object({
  licenseKey: z.string().min(1),
  product: z.enum(['ezpos', 'crossxpos', 'ezoffice']).optional(),
  deviceId: z.string().min(1).optional(),
  installationId: z.string().min(1).optional(),
});

const activateSchema = z.object({
  licenseKey: z.string().min(1),
  product: z.enum(['ezpos', 'crossxpos', 'ezoffice']),
  deviceId: z.string().min(1),
  installationId: z.string().min(1).optional(),
});

const activateByAccountSchema = z.object({
  product: z.enum(['ezpos', 'crossxpos', 'ezoffice']),
  deviceId: z.string().min(1),
  installationId: z.string().min(1).optional(),
});

const deactivateSchema = z.object({
  licenseKey: z.string().min(1),
  deviceId: z.string().min(1),
});

const transferRequestSchema = z.object({
  licenseKey: z.string().min(1),
  fromDeviceId: z.string().min(1),
  toDeviceId: z.string().min(1).optional(),
  requestedBy: z.string().optional(),
});

const transferConfirmSchema = z.object({
  transferRequestId: z.string().uuid(),
  toDeviceId: z.string().min(1),
  confirmedBy: z.string().optional(),
});

type ValidationResult = ReturnType<typeof buildValidationResult>;

type PersistenceOutcome = {
  persisted: boolean;
  mode: 'central' | 'compatibility';
  note?: string;
};

function buildValidationResult(status: ValidationStatus, details?: {
  product?: ProductType;
  planName?: string;
  expiresAt?: string;
  customerName?: string;
  expectedProduct?: ProductType;
  policy?: Pick<ProductPolicy, 'graceDays' | 'revalidateAfterHours'>;
}): {
  valid: boolean;
  decision: ValidationDecision;
  status: ValidationStatus;
  reason_code: string;
  client_action: string;
  product?: ProductType;
  plan?: string;
  expiresAt?: string;
  customerName?: string;
  expired: boolean;
  expectedProduct?: ProductType;
  policy: {
    graceDays: number;
    revalidateAfterHours: number;
  };
  error?: string;
} {
  const decisionByStatus: Record<ValidationStatus, ValidationDecision> = {
    valid: 'allow',
    expired: 'deny',
    not_found: 'deny',
    revoked: 'deny',
    product_mismatch: 'deny',
    seat_exceeded: 'deny',
    device_mismatch: 'deny',
  };

  const reasonCodeByStatus: Record<ValidationStatus, string> = {
    valid: 'VALID',
    expired: 'ENTITLEMENT_EXPIRED',
    not_found: 'LICENSE_NOT_FOUND',
    revoked: 'ENTITLEMENT_REVOKED',
    product_mismatch: 'PRODUCT_MISMATCH',
    seat_exceeded: 'SEAT_LIMIT_EXCEEDED',
    device_mismatch: 'DEVICE_MISMATCH',
  };

  const clientActionByStatus: Record<ValidationStatus, string> = {
    valid: 'continue',
    expired: 'renew_subscription',
    not_found: 'check_key_or_contact_support',
    revoked: 'contact_support',
    product_mismatch: 'use_correct_product_license',
    seat_exceeded: 'release_other_device_or_upgrade',
    device_mismatch: 'request_transfer',
  };

  const base = {
    valid: status === 'valid',
    decision: decisionByStatus[status],
    status,
    reason_code: reasonCodeByStatus[status],
    client_action: clientActionByStatus[status],
    product: details?.product,
    plan: details?.planName,
    expiresAt: details?.expiresAt,
    customerName: details?.customerName,
    expired: status === 'expired',
    expectedProduct: details?.expectedProduct,
    policy: {
      graceDays: details?.policy?.graceDays
        ?? FALLBACK_POLICY_BY_PRODUCT[details?.product ?? 'ezpos'].graceDays,
      revalidateAfterHours: details?.policy?.revalidateAfterHours
        ?? FALLBACK_POLICY_BY_PRODUCT[details?.product ?? 'ezpos'].revalidateAfterHours,
    },
  };

  if (status === 'valid') {
    return base;
  }

  const errorByStatus: Record<Exclude<ValidationStatus, 'valid'>, string> = {
    not_found: 'License key not found',
    expired: 'License has expired',
    revoked: 'License is no longer active',
    product_mismatch: 'License is not valid for this product',
    seat_exceeded: 'Seat limit exceeded for this entitlement',
    device_mismatch: 'Device does not match active binding for this entitlement',
  };

  return {
    ...base,
    error: errorByStatus[status],
  };
}

async function validateLicenseKey(licenseKey: string, expectedProduct?: ProductType) {
  // ── V1 path: check license_credentials → entitlements ─────────────────
  const { data: cred, error: credError } = await supabase
    .from('license_credentials')
    .select(`
      license_key, status,
      entitlements (
        id, status, expires_at,
        customers ( name ),
        plans ( name, products ( code ) )
      )
    `)
    .eq('license_key', licenseKey)
    .maybeSingle();

  if (!credError && cred) {
    const ent = (cred as any).entitlements;
    const product = ent?.plans?.products?.code as ProductType | undefined;
    const planName = ent?.plans?.name as string | undefined;
    const expiresAt = ent?.expires_at as string | undefined;
    const customerName = ent?.customers?.name as string | undefined;

    if (cred.status === 'revoked' || ent?.status === 'revoked') {
      return buildValidationResult('revoked', { product, planName, expiresAt, customerName, expectedProduct });
    }

    if (expectedProduct && product && product !== expectedProduct) {
      return buildValidationResult('product_mismatch', { product, planName, expiresAt, customerName, expectedProduct });
    }

    const expired = expiresAt ? new Date(expiresAt) < new Date() : false;
    if (expired || ent?.status === 'expired') {
      return buildValidationResult('expired', { product, planName, expiresAt, customerName, expectedProduct });
    }

    if (ent?.status === 'suspended') {
      return buildValidationResult('revoked', { product, planName, expiresAt, customerName, expectedProduct });
    }

    return buildValidationResult('valid', { product, planName, expiresAt, customerName, expectedProduct });
  }

  // ── Legacy fallback: check licenses table ──────────────────────────────
  const { data, error } = await supabase
    .from('licenses')
    .select('key, product, plan_name, expires_at, is_active, customer_name')
    .eq('key', licenseKey)
    .single();

  if (error || !data) {
    return buildValidationResult('not_found');
  }

  const product = data.product as ProductType;
  if (expectedProduct && product !== expectedProduct) {
    return buildValidationResult('product_mismatch', {
      product,
      planName: data.plan_name,
      expiresAt: data.expires_at,
      customerName: data.customer_name,
      expectedProduct,
    });
  }

  const expired = new Date(data.expires_at) < new Date();
  if (!data.is_active) {
    return buildValidationResult('revoked', {
      product,
      planName: data.plan_name,
      expiresAt: data.expires_at,
      customerName: data.customer_name,
      expectedProduct,
    });
  }

  if (expired) {
    return buildValidationResult('expired', {
      product,
      planName: data.plan_name,
      expiresAt: data.expires_at,
      customerName: data.customer_name,
      expectedProduct,
    });
  }

  return buildValidationResult('valid', {
    product,
    planName: data.plan_name,
    expiresAt: data.expires_at,
    customerName: data.customer_name,
    expectedProduct,
  });
}

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) {
    return false;
  }
  return error.code === '42P01' || /relation .* does not exist/i.test(error.message ?? '');
}

async function resolveEntitlementIdByLicenseKey(licenseKey: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('license_credentials')
    .select('entitlement_id')
    .eq('license_key', licenseKey)
    .maybeSingle();

  if (!error && data?.entitlement_id) {
    return data.entitlement_id as string;
  }

  if (!isMissingRelationError(error)) {
    console.warn('[licensing-v1] entitlement lookup unavailable', {
      code: error?.code,
      message: error?.message,
    });
  }

  return null;
}

/**
 * Loads a product's policy from product_policy_profiles (device binding mode,
 * seat limit, offline grace days, revalidate interval). Falls back to
 * FALLBACK_POLICY_BY_PRODUCT if the row or the table itself is missing —
 * every product should be onboarded with a policy row (see
 * supabase-ezoffice-onboarding.sql for the seeding pattern), but a missing
 * row degrades to safe defaults rather than throwing. Not cached: this table
 * is admin-configurable and the lookup is a single indexed query, so a
 * restart should not be required for a policy change to take effect.
 */
async function getProductIdByCode(product: ProductType): Promise<string | null> {
  const { data } = await supabase
    .from('products')
    .select('id')
    .eq('code', product)
    .maybeSingle();
  return data?.id ?? null;
}

async function getProductPolicy(product: ProductType): Promise<ProductPolicy> {
  const productId = await getProductIdByCode(product);
  if (!productId) {
    return FALLBACK_POLICY_BY_PRODUCT[product];
  }

  const { data, error } = await supabase
    .from('product_policy_profiles')
    .select('device_binding_mode, seat_limit, offline_grace_days, revalidate_after_hours')
    .eq('product_id', productId)
    .maybeSingle();

  if (error || !data) {
    if (error && !isMissingRelationError(error)) {
      console.warn('[licensing-v1] policy profile lookup failed, using fallback', {
        product,
        code: error.code,
        message: error.message,
      });
    }
    return FALLBACK_POLICY_BY_PRODUCT[product];
  }

  return {
    bindingMode: data.device_binding_mode as BindingMode,
    seatLimit: data.seat_limit as number,
    graceDays: data.offline_grace_days as number,
    revalidateAfterHours: data.revalidate_after_hours as number,
  };
}

async function getActiveDeviceIds(entitlementId: string): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('activations')
    .select('device_id')
    .eq('entitlement_id', entitlementId)
    .eq('status', 'active');

  if (!error) {
    return (data ?? []).map(row => row.device_id as string).filter(Boolean);
  }

  if (!isMissingRelationError(error)) {
    console.warn('[licensing-v1] active-device lookup skipped', {
      code: error.code,
      message: error.message,
    });
  }

  return null;
}

function rebuildFromStatus(
  source: ValidationResult,
  status: ValidationStatus,
  policy?: Pick<ProductPolicy, 'graceDays' | 'revalidateAfterHours'>,
): ValidationResult {
  return buildValidationResult(status, {
    product: source.product as ProductType | undefined,
    planName: source.plan,
    expiresAt: source.expiresAt,
    customerName: source.customerName,
    expectedProduct: source.expectedProduct,
    policy: policy ?? { graceDays: source.policy.graceDays, revalidateAfterHours: source.policy.revalidateAfterHours },
  });
}

async function applyDevicePolicy(
  licenseKey: string,
  current: ValidationResult,
  deviceId?: string
): Promise<ValidationResult> {
  if (current.decision !== 'allow' || !current.product) {
    return current;
  }

  const entitlementId = await resolveEntitlementIdByLicenseKey(licenseKey);
  if (!entitlementId) {
    return current;
  }

  const activeDeviceIds = await getActiveDeviceIds(entitlementId);
  if (!activeDeviceIds) {
    return current;
  }

  const policy = await getProductPolicy(current.product as ProductType);
  // Attach the real DB-driven policy hint (graceDays/revalidateAfterHours) onto
  // the response regardless of the device-binding outcome below — callers must
  // see the product's actual offline-grace policy, not the generic fallback.
  const withPolicy: ValidationResult = {
    ...current,
    policy: { graceDays: policy.graceDays, revalidateAfterHours: policy.revalidateAfterHours },
  };

  if (!deviceId) {
    return policy.bindingMode === 'strict'
      ? rebuildFromStatus(withPolicy, 'device_mismatch', policy)
      : withPolicy;
  }

  if (activeDeviceIds.includes(deviceId)) {
    return withPolicy;
  }

  if (activeDeviceIds.length === 0) {
    return withPolicy;
  }

  if (policy.bindingMode === 'strict') {
    return rebuildFromStatus(withPolicy, 'device_mismatch', policy);
  }

  if (activeDeviceIds.length >= policy.seatLimit) {
    return rebuildFromStatus(withPolicy, 'seat_exceeded', policy);
  }

  return withPolicy;
}

async function persistValidationEvent(
  entitlementId: string | null,
  result: ValidationResult,
  req: Request
): Promise<string | null> {
  const { data, error } = await supabase
    .from('validation_events')
    .insert({
      entitlement_id: entitlementId,
      decision: result.decision,
      status: result.status,
      reason_code: result.reason_code,
      client_action: result.client_action,
      request_ip: req.ip,
      user_agent: req.get('user-agent') ?? null,
    })
    .select('id')
    .single();

  if (!error && data?.id) {
    return data.id as string;
  }

  if (!isMissingRelationError(error)) {
    console.warn('[licensing-v1] validation event persistence skipped', {
      code: error?.code,
      message: error?.message,
    });
  }

  return null;
}

async function upsertActivation(
  entitlementId: string,
  deviceId: string,
  installationId: string | undefined
): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('activations')
    .upsert(
      {
        entitlement_id: entitlementId,
        device_id: deviceId,
        installation_id: installationId ?? null,
        status: 'active',
        first_activated_at: now,
        last_validated_at: now,
      },
      { onConflict: 'entitlement_id,device_id' }
    );

  if (!error) {
    return true;
  }

  if (!isMissingRelationError(error)) {
    console.warn('[licensing-v1] activation persistence skipped', {
      code: error.code,
      message: error.message,
    });
  }

  return false;
}

async function persistValidationAndActivation(
  licenseKey: string,
  result: ValidationResult,
  req: Request,
  deviceId?: string,
  installationId?: string
): Promise<PersistenceOutcome> {
  const entitlementId = await resolveEntitlementIdByLicenseKey(licenseKey);
  const validationEventId = await persistValidationEvent(entitlementId, result, req);

  if (!entitlementId) {
    return {
      persisted: Boolean(validationEventId),
      mode: 'compatibility',
      note: 'Entitlement mapping unavailable; activation write skipped.',
    };
  }

  if (!deviceId || result.decision !== 'allow') {
    return {
      persisted: Boolean(validationEventId),
      mode: 'central',
      note: 'Validation event persisted; activation upsert not required.',
    };
  }

  const activationPersisted = await upsertActivation(entitlementId, deviceId, installationId);
  return {
    persisted: activationPersisted || Boolean(validationEventId),
    mode: activationPersisted ? 'central' : 'compatibility',
    note: activationPersisted
      ? 'Validation and activation persisted.'
      : 'Validation persisted partially; activation table unavailable.',
  };
}

// POST /api/v1/licensing/validate
router.post('/validate', async (req: Request, res: Response) => {
  const parsed = validateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      decision: 'deny',
      status: 'not_found',
      reason_code: 'INVALID_REQUEST',
      client_action: 'fix_request_payload',
      errors: parsed.error.flatten(),
    });
    return;
  }

  const licenseKey = parsed.data.licenseKey.trim();
  const validated = await validateLicenseKey(licenseKey, parsed.data.product);
  const result = await applyDevicePolicy(licenseKey, validated, parsed.data.deviceId);
  const persistence = await persistValidationAndActivation(
    licenseKey,
    result,
    req,
    parsed.data.deviceId,
    parsed.data.installationId
  );

  res.json({
    ...result,
    persistence,
  });
});

// POST /api/v1/licensing/activate
router.post('/activate', async (req: Request, res: Response) => {
  const parsed = activateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      decision: 'deny',
      status: 'not_found',
      reason_code: 'INVALID_REQUEST',
      client_action: 'fix_request_payload',
      errors: parsed.error.flatten(),
    });
    return;
  }

  const { licenseKey, product, deviceId, installationId } = parsed.data;
  const normalizedKey = licenseKey.trim();
  const validated = await validateLicenseKey(normalizedKey, product);
  const validation = await applyDevicePolicy(normalizedKey, validated, deviceId);
  const persistence = await persistValidationAndActivation(
    normalizedKey,
    validation,
    req,
    deviceId,
    installationId
  );

  if (validation.decision !== 'allow') {
    res.json({
      ...validation,
      persistence,
    });
    return;
  }

  const transferPolicy = await getProductPolicy(product);
  res.json({
    ...validation,
    persistence,
    activation: {
      status: 'active',
      deviceId,
      installationId: installationId ?? null,
      activatedAt: new Date().toISOString(),
      transferMode: transferPolicy.bindingMode === 'flexible' ? 'self_service' : 'admin_mediated',
    },
  });
});

// ─── Activate by account (email/magic-link identity) ─────────────────────────
// Bridges a Supabase-session customer identity to their license key, so a
// desktop client (e.g. EZOffice) can activate without the user ever seeing or
// typing a license key — they authenticate once via Supabase magic-link/OTP,
// and this endpoint resolves + activates the matching entitlement for them.
// The customer-resolution logic mirrors requirePortalAuth in portal.ts.

async function resolveCustomerFromBearerToken(
  req: Request
): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return null;
  }

  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('id, email')
    .eq('email', user.email)
    .maybeSingle();

  if (custError || !customer) {
    return null;
  }

  return customer;
}

async function findActiveLicenseKeyForCustomer(
  customerId: string,
  product: ProductType
): Promise<string | null> {
  const productId = await getProductIdByCode(product);
  if (!productId) return null;

  const { data, error } = await supabase
    .from('entitlements')
    .select('status, license_credentials(license_key, status)')
    .eq('customer_id', customerId)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return null;
  }

  for (const ent of data as any[]) {
    if (ent.status === 'revoked' || ent.status === 'expired') continue;
    const cred = (ent.license_credentials ?? []).find((c: any) => c.status === 'active');
    if (cred) return cred.license_key as string;
  }

  return null;
}

// POST /api/v1/licensing/activate-by-account
router.post('/activate-by-account', async (req: Request, res: Response) => {
  const parsed = activateByAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      decision: 'deny',
      status: 'not_found',
      reason_code: 'INVALID_REQUEST',
      client_action: 'fix_request_payload',
      errors: parsed.error.flatten(),
    });
    return;
  }

  const customer = await resolveCustomerFromBearerToken(req);
  if (!customer) {
    res.status(401).json({
      decision: 'deny',
      status: 'not_found',
      reason_code: 'INVALID_SESSION',
      client_action: 'sign_in_again',
      error: 'Invalid or expired session — please sign in again.',
    });
    return;
  }

  const { product, deviceId, installationId } = parsed.data;
  const licenseKey = await findActiveLicenseKeyForCustomer(customer.id, product);
  if (!licenseKey) {
    res.json({
      valid: false,
      decision: 'deny',
      status: 'not_found',
      reason_code: 'NO_ENTITLEMENT_FOR_ACCOUNT',
      client_action: 'contact_support',
      product,
      expired: false,
      policy: FALLBACK_POLICY_BY_PRODUCT[product],
      error: `No active ${product} license found for ${customer.email}.`,
    });
    return;
  }

  const validated = await validateLicenseKey(licenseKey, product);
  const validation = await applyDevicePolicy(licenseKey, validated, deviceId);
  const persistence = await persistValidationAndActivation(
    licenseKey,
    validation,
    req,
    deviceId,
    installationId
  );

  // licenseKey is included in this response (unlike a browser-facing endpoint,
  // this is a first-party desktop client authenticating its own account) so
  // the client can cache it locally and call the plain /validate endpoint for
  // silent background revalidation later, without requiring the customer to
  // re-authenticate via OTP on every check — that would break offline-first
  // continuity (see docs/LICENSE_INTEGRATION_AUDIT.md target flow).
  if (validation.decision !== 'allow') {
    res.json({ ...validation, persistence, licenseKey });
    return;
  }

  const transferPolicy = await getProductPolicy(product);
  res.json({
    ...validation,
    persistence,
    licenseKey,
    activation: {
      status: 'active',
      deviceId,
      installationId: installationId ?? null,
      activatedAt: new Date().toISOString(),
      transferMode: transferPolicy.bindingMode === 'flexible' ? 'self_service' : 'admin_mediated',
    },
  });
});

// POST /api/v1/licensing/deactivate
router.post('/deactivate', async (req: Request, res: Response) => {
  const parsed = deactivateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', errors: parsed.error.flatten() });
    return;
  }

  const { licenseKey, deviceId } = parsed.data;
  const entitlementId = await resolveEntitlementIdByLicenseKey(licenseKey.trim());
  if (!entitlementId) {
    res.status(404).json({ error: 'License key not found or not linked to an entitlement' });
    return;
  }

  const { error: releaseError } = await supabase
    .from('activations')
    .update({ status: 'released', updated_at: new Date().toISOString() })
    .eq('entitlement_id', entitlementId)
    .eq('device_id', deviceId)
    .eq('status', 'active');

  if (releaseError) {
    console.error('[licensing-v1] deactivate failed', releaseError);
    res.status(500).json({ error: 'Deactivation failed' });
    return;
  }

  await supabase.from('audit_events').insert({
    actor_type: 'system',
    actor_id: deviceId,
    action: 'deactivated',
    entity_type: 'activation',
    entity_id: entitlementId,
    payload_json: { device_id: deviceId, license_key: licenseKey },
  });

  res.json({
    success: true,
    message: 'Device deactivated successfully.',
    deviceId,
    deactivatedAt: new Date().toISOString(),
  });
});

// POST /api/v1/licensing/transfers/request
router.post('/transfers/request', async (req: Request, res: Response) => {
  const parsed = transferRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', errors: parsed.error.flatten() });
    return;
  }

  const { licenseKey, fromDeviceId, toDeviceId, requestedBy } = parsed.data;
  const entitlementId = await resolveEntitlementIdByLicenseKey(licenseKey.trim());
  if (!entitlementId) {
    res.status(404).json({ error: 'License key not found or not linked to an entitlement' });
    return;
  }

  // Find the current activation for this device
  const { data: fromActivation } = await supabase
    .from('activations')
    .select('id')
    .eq('entitlement_id', entitlementId)
    .eq('device_id', fromDeviceId)
    .eq('status', 'active')
    .maybeSingle();

  // Determine transfer mode from policy
  const policy = await getProductPolicyFromDb(entitlementId);
  const transferMode = policy?.transfer_mode ?? 'admin_mediated';

  const { data: transferRequest, error: insertError } = await supabase
    .from('transfer_requests')
    .insert({
      entitlement_id: entitlementId,
      from_activation_id: fromActivation?.id ?? null,
      to_device_id: toDeviceId ?? null,
      status: 'requested',
      requested_by: requestedBy ?? fromDeviceId,
      reason: 'device_transfer',
    })
    .select('id, status')
    .single();

  if (insertError || !transferRequest) {
    console.error('[licensing-v1] transfer request failed', insertError);
    res.status(500).json({ error: 'Failed to create transfer request' });
    return;
  }

  await supabase.from('audit_events').insert({
    actor_type: 'customer',
    actor_id: requestedBy ?? fromDeviceId,
    action: 'transfer_requested',
    entity_type: 'transfer_request',
    entity_id: transferRequest.id,
    payload_json: { entitlement_id: entitlementId, from_device: fromDeviceId, to_device: toDeviceId ?? null },
  });

  res.json({
    transferRequestId: transferRequest.id,
    status: transferRequest.status,
    transferMode,
    message: transferMode === 'self_service'
      ? 'Transfer request created. Confirm with POST /transfers/confirm.'
      : 'Transfer request submitted. Admin review required.',
  });
});

// POST /api/v1/licensing/transfers/confirm
router.post('/transfers/confirm', async (req: Request, res: Response) => {
  const parsed = transferConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', errors: parsed.error.flatten() });
    return;
  }

  const { transferRequestId, toDeviceId, confirmedBy } = parsed.data;

  const { data: transferReq, error: fetchError } = await supabase
    .from('transfer_requests')
    .select('id, entitlement_id, from_activation_id, status')
    .eq('id', transferRequestId)
    .single();

  if (fetchError || !transferReq) {
    res.status(404).json({ error: 'Transfer request not found' });
    return;
  }

  if (transferReq.status !== 'requested') {
    res.status(409).json({
      error: 'Transfer request is not in a confirmable state',
      currentStatus: transferReq.status,
    });
    return;
  }

  // Release old activation
  if (transferReq.from_activation_id) {
    await supabase
      .from('activations')
      .update({ status: 'released', updated_at: new Date().toISOString() })
      .eq('id', transferReq.from_activation_id);
  }

  // Upsert new activation for target device
  const now = new Date().toISOString();
  const { error: activationError } = await supabase
    .from('activations')
    .upsert(
      {
        entitlement_id: transferReq.entitlement_id,
        device_id: toDeviceId,
        status: 'active',
        first_activated_at: now,
        last_validated_at: now,
      },
      { onConflict: 'entitlement_id,device_id' }
    );

  if (activationError) {
    console.error('[licensing-v1] transfer confirm activation upsert failed', activationError);
    res.status(500).json({ error: 'Failed to activate new device' });
    return;
  }

  // Mark transfer as completed
  await supabase
    .from('transfer_requests')
    .update({
      status: 'completed',
      to_device_id: toDeviceId,
      reviewed_by: confirmedBy ?? 'system',
      updated_at: new Date().toISOString(),
    })
    .eq('id', transferRequestId);

  await supabase.from('audit_events').insert({
    actor_type: confirmedBy ? 'admin' : 'system',
    actor_id: confirmedBy ?? 'system',
    action: 'transfer_confirmed',
    entity_type: 'transfer_request',
    entity_id: transferRequestId,
    payload_json: {
      entitlement_id: transferReq.entitlement_id,
      to_device: toDeviceId,
      released_activation_id: transferReq.from_activation_id ?? null,
    },
  });

  res.json({
    success: true,
    transferRequestId,
    newDeviceId: toDeviceId,
    activatedAt: now,
    message: 'Transfer completed. New device is now active.',
  });
});

// GET /api/v1/licensing/entitlements/:id
router.get('/entitlements/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const licenseKey = req.query.licenseKey as string | undefined;

  if (!id.match(/^[0-9a-f-]{36}$/i)) {
    res.status(400).json({ error: 'Invalid entitlement ID format' });
    return;
  }

  const { data: entitlement, error } = await supabase
    .from('entitlements')
    .select(`
      id, status, starts_at, expires_at, created_at, updated_at,
      customers(id, name, email),
      products(id, code, name),
      plans(id, code, name, billing_model),
      activations(id, device_id, installation_id, status, first_activated_at, last_validated_at),
      subscriptions(id, provider, provider_subscription_id, status, current_period_start, current_period_end),
      license_credentials(id, license_key, status, issued_at, revoked_at)
    `)
    .eq('id', id)
    .single();

  if (error || !entitlement) {
    res.status(404).json({ error: 'Entitlement not found' });
    return;
  }

  // If licenseKey provided, verify it belongs to this entitlement
  if (licenseKey) {
    const creds = entitlement.license_credentials as Array<{ license_key: string }> | null;
    const match = creds?.some(c => c.license_key === licenseKey.trim());
    if (!match) {
      res.status(403).json({ error: 'License key does not match this entitlement' });
      return;
    }
  }

  res.json(entitlement);
});

// ─── Helper: policy lookup from DB ────────────────────────────────────────

async function getProductPolicyFromDb(
  entitlementId: string
): Promise<{ transfer_mode: string } | null> {
  const { data } = await supabase
    .from('entitlements')
    .select('product_id')
    .eq('id', entitlementId)
    .maybeSingle();

  if (!data?.product_id) return null;

  const { data: profile } = await supabase
    .from('product_policy_profiles')
    .select('transfer_mode')
    .eq('product_id', data.product_id)
    .maybeSingle();

  return profile ?? null;
}

export default router;
