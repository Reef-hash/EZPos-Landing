import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

type ProductType = 'ezpos' | 'crossxpos';
type ValidationStatus = 'valid' | 'expired' | 'not_found' | 'revoked' | 'product_mismatch';
type ValidationDecision = 'allow' | 'deny' | 'allow_temporarily';

function isProductType(value: string): value is ProductType {
  return value === 'ezpos' || value === 'crossxpos';
}

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
  };

  const reasonCodeByStatus: Record<ValidationStatus, string> = {
    valid: 'VALID',
    expired: 'ENTITLEMENT_EXPIRED',
    not_found: 'LICENSE_NOT_FOUND',
    revoked: 'ENTITLEMENT_REVOKED',
    product_mismatch: 'PRODUCT_MISMATCH',
  };

  const clientActionByStatus: Record<ValidationStatus, string> = {
    valid: 'continue',
    expired: 'renew_subscription',
    not_found: 'check_key_or_contact_support',
    revoked: 'contact_support',
    product_mismatch: 'use_correct_product_license',
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
  };

  return {
    ...base,
    error: errorByStatus[status],
  };
}

async function handleLicenseValidation(key: string, requestedProductRaw: string | undefined, res: Response) {
  const requestedProduct = requestedProductRaw?.toLowerCase();

  if (requestedProduct && !isProductType(requestedProduct)) {
    res.status(400).json({ error: 'Invalid product query. Use ezpos or crossxpos.' });
    return;
  }

  const { data, error } = await supabase
    .from('licenses')
    .select('key, product, plan_name, expires_at, is_active, customer_name')
    .eq('key', key)
    .single();

  if (error || !data) {
    res.json(buildValidationResult('not_found'));
    return;
  }

  const expectedProduct = requestedProduct as ProductType | undefined;
  const product = data.product as ProductType;
  if (expectedProduct && product !== expectedProduct) {
    res.json(buildValidationResult('product_mismatch', {
      product,
      planName: data.plan_name,
      expiresAt: data.expires_at,
      customerName: data.customer_name,
      expectedProduct,
    }));
    return;
  }

  const expired = new Date(data.expires_at) < new Date();
  if (!data.is_active) {
    res.json(buildValidationResult('revoked', {
      product,
      planName: data.plan_name,
      expiresAt: data.expires_at,
      customerName: data.customer_name,
      expectedProduct,
    }));
    return;
  }

  if (expired) {
    res.json(buildValidationResult('expired', {
      product,
      planName: data.plan_name,
      expiresAt: data.expires_at,
      customerName: data.customer_name,
      expectedProduct,
    }));
    return;
  }

  res.json(buildValidationResult('valid', {
    product,
    planName: data.plan_name,
    expiresAt: data.expires_at,
    customerName: data.customer_name,
    expectedProduct,
  }));
}

// GET /api/licenses — public: verify a license key
router.get('/verify/:key', async (req: Request, res: Response) => {
  await handleLicenseValidation(req.params.key, req.query.product?.toString(), res);
});

// Alias route for future product integration clients.
router.get('/validate/:key', async (req: Request, res: Response) => {
  await handleLicenseValidation(req.params.key, req.query.product?.toString(), res);
});

// Legacy compatibility endpoint for EZPos desktop client.
// Accepts POST /api/licenses/validate { LicenseKey, DeviceId }
router.post('/validate', async (req: Request, res: Response) => {
  const payload = req.body ?? {};
  const key = payload.LicenseKey ?? payload.licenseKey ?? payload.key;
  const requestedProduct = payload.Product ?? payload.product ?? 'ezpos';

  if (typeof key !== 'string' || !key.trim()) {
    res.status(400).json({
      IsValid: false,
      IsOffline: false,
      Message: 'License key is required.',
      Decision: 'deny',
      Status: 'not_found',
      ReasonCode: 'LICENSE_KEY_REQUIRED',
      ClientAction: 'provide_license_key',
    });
    return;
  }

  let resultPayload: Record<string, unknown> | null = null;
  const proxyResponse = {
    status: (_code: number) => proxyResponse,
    json: (payloadToCapture: Record<string, unknown>) => {
      resultPayload = payloadToCapture;
      return proxyResponse;
    },
  } as unknown as Response;

  await handleLicenseValidation(key.trim(), String(requestedProduct), proxyResponse);

  const result = resultPayload as ReturnType<typeof buildValidationResult> | null;
  if (!result) {
    res.status(500).json({
      IsValid: false,
      IsOffline: false,
      Message: 'Validation failed.',
      Decision: 'deny',
      Status: 'not_found',
      ReasonCode: 'VALIDATION_INTERNAL_ERROR',
      ClientAction: 'retry_later',
    });
    return;
  }

  res.json({
    IsValid: result.valid,
    IsOffline: false,
    Message: result.error ?? 'License is valid.',
    Decision: result.decision,
    Status: result.status,
    ReasonCode: result.reason_code,
    ClientAction: result.client_action,
    Product: result.product,
    Plan: result.plan,
    ExpiresAt: result.expiresAt,
    Policy: result.policy,
  });
});

export default router;
