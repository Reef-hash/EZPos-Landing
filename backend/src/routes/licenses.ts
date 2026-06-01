import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

type ProductType = 'ezpos' | 'crossxpos';
type ValidationStatus = 'valid' | 'expired' | 'not_found' | 'revoked' | 'product_mismatch';

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
  status: ValidationStatus;
  product?: ProductType;
  plan?: string;
  expiresAt?: string;
  customerName?: string;
  expired: boolean;
  expectedProduct?: ProductType;
  error?: string;
} {
  const base = {
    valid: status === 'valid',
    status,
    product: details?.product,
    plan: details?.planName,
    expiresAt: details?.expiresAt,
    customerName: details?.customerName,
    expired: status === 'expired',
    expectedProduct: details?.expectedProduct,
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

export default router;
