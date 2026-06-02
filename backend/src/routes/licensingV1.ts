import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { z } from 'zod';

const router = Router();

type ProductType = 'ezpos' | 'crossxpos';
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
};

const validateSchema = z.object({
  licenseKey: z.string().min(1),
  product: z.enum(['ezpos', 'crossxpos']).optional(),
  deviceId: z.string().min(1).optional(),
  installationId: z.string().min(1).optional(),
});

const activateSchema = z.object({
  licenseKey: z.string().min(1),
  product: z.enum(['ezpos', 'crossxpos']),
  deviceId: z.string().min(1),
  installationId: z.string().min(1).optional(),
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
      graceDays: details?.product === 'crossxpos' ? 3 : 7,
      revalidateAfterHours: details?.product === 'crossxpos' ? 12 : 24,
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

function getProductPolicy(product: ProductType): ProductPolicy {
  if (product === 'ezpos') {
    return { bindingMode: 'strict', seatLimit: 1 };
  }

  // Baseline policy before dedicated profile-table lookup.
  return { bindingMode: 'flexible', seatLimit: 3 };
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

function rebuildFromStatus(source: ValidationResult, status: ValidationStatus): ValidationResult {
  return buildValidationResult(status, {
    product: source.product as ProductType | undefined,
    planName: source.plan,
    expiresAt: source.expiresAt,
    customerName: source.customerName,
    expectedProduct: source.expectedProduct,
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

  const policy = getProductPolicy(current.product as ProductType);
  if (!deviceId) {
    return policy.bindingMode === 'strict'
      ? rebuildFromStatus(current, 'device_mismatch')
      : current;
  }

  if (activeDeviceIds.includes(deviceId)) {
    return current;
  }

  if (activeDeviceIds.length === 0) {
    return current;
  }

  if (policy.bindingMode === 'strict') {
    return rebuildFromStatus(current, 'device_mismatch');
  }

  if (activeDeviceIds.length >= policy.seatLimit) {
    return rebuildFromStatus(current, 'seat_exceeded');
  }

  return current;
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

  res.json({
    ...validation,
    persistence,
    activation: {
      status: 'active',
      deviceId,
      installationId: installationId ?? null,
      activatedAt: new Date().toISOString(),
      transferMode: product === 'crossxpos' ? 'self_service' : 'admin_mediated',
    },
  });
});

export default router;
