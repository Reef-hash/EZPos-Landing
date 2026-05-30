import { Router, Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import crypto from 'crypto';
import Stripe from 'stripe';

const router = Router();

// Stripe sends raw body — no express.json() applied to this route
router.post('/', express_rawBody, async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature error:', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === 'paid') {
      await handleSuccessfulPayment(session);
    }
  }

  res.json({ received: true });
});

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { planId, product, customerName, planName, addonIds } = session.metadata as Record<string, string>;
  const customerEmail = session.customer_email!;

  const parsedAddonIds = (() => {
    try {
      const ids = JSON.parse(addonIds ?? '[]');
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  })();

  const purchasedAddons = parsedAddonIds.length > 0
    ? (await supabase.from('addons').select('id,name,price_myr').in('id', parsedAddonIds)).data ?? []
    : [];

  // Fetch plan details for expiry calculation
  const { data: plan } = await supabase
    .from('pricing_plans')
    .select('duration_days')
    .eq('id', planId)
    .single();

  const durationDays = plan?.duration_days ?? 365;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  // Generate license key: PRODUCT-PLAN-RANDOM
  const licenseKey = generateLicenseKey(product, planName);

  await supabase.from('licenses').insert({
    key: licenseKey,
    product,
    plan_name: planName,
    plan_id: planId,
    customer_name: customerName,
    customer_email: customerEmail,
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent as string,
    addons_json: purchasedAddons,
    expires_at: expiresAt.toISOString(),
    is_active: true,
  });

  // Record sale
  await supabase.from('sales').insert({
    product,
    plan_id: planId,
    plan_name: planName,
    customer_name: customerName,
    customer_email: customerEmail,
    amount_myr: (session.amount_total ?? 0) / 100,
    addons_json: purchasedAddons,
    stripe_session_id: session.id,
    paid_at: new Date().toISOString(),
  });
}

function generateLicenseKey(product: string, plan: string): string {
  const prefix = product === 'ezpos' ? 'EZP' : 'CXP';
  const planCode = plan.toUpperCase().substring(0, 3);
  const random = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${planCode}-${random.substring(0, 4)}-${random.substring(4, 8)}-${random.substring(8)}`;
}

// Middleware to capture raw body for Stripe signature verification
function express_rawBody(req: any, _res: any, next: any) {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk: string) => { data += chunk; });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
}

export default router;
