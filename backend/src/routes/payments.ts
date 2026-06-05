import { Router, Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { z } from 'zod';
import Stripe from 'stripe';

const router = Router();

const ALLOWED_PAYMENT_METHOD_TYPES: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [
  'card',
  'fpx',
  'grabpay',
];

const checkoutSchema = z.object({
  planId: z.string().uuid(),
  product: z.enum(['ezpos', 'crossxpos']),
  addonIds: z.array(z.string().uuid()).optional().default([]),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
});

// POST /api/payments/checkout — create Stripe Checkout session
router.post('/checkout', async (req: Request, res: Response) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  const { planId, product, addonIds, customerEmail, customerName } = parsed.data;
  if (product === 'crossxpos') {
    res.status(403).json({ error: 'CrossxPos is currently under development and not available for purchase.' });
    return;
  }

  // Fetch plan from DB
  const { data: plan, error: planError } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('id', planId)
    .eq('product', product)
    .eq('is_active', true)
    .single();

  if (planError || !plan) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }

  const addons = addonIds.length > 0
    ? (await supabase
      .from('addons')
      .select('*')
      .in('id', addonIds)
      .eq('is_active', true)).data ?? []
    : [];

  const invalidAddonCount = addons.length !== addonIds.length;
  if (invalidAddonCount) {
    res.status(400).json({ error: 'Some add-ons are invalid or inactive' });
    return;
  }

  const invalidProductAddon = addons.some(a => a.product !== 'all' && a.product !== product);
  if (invalidProductAddon) {
    res.status(400).json({ error: 'One or more add-ons are not available for this product' });
    return;
  }

  try {
    const lineItems = [
      {
        price_data: {
          currency: 'myr',
          product_data: {
            name: `${plan.product_label} — ${plan.name}`,
            description: plan.description,
          },
          unit_amount: Math.round(plan.price_myr * 100),
        },
        quantity: 1,
      },
      ...addons.map(addon => ({
        price_data: {
          currency: 'myr',
          product_data: {
            name: `Add-on: ${addon.name}`,
            description: addon.description,
            images: addon.image_url ? [addon.image_url] : undefined,
          },
          unit_amount: Math.round(addon.price_myr * 100),
        },
        quantity: 1,
      })),
    ];

    const primaryPaymentMethods = getPaymentMethodTypes();

    const basePayload: Stripe.Checkout.SessionCreateParams = {
      customer_email: customerEmail,
      line_items: lineItems,
      mode: 'payment',
      metadata: {
        planId,
        product,
        customerName,
        planName: plan.name,
        addonIds: JSON.stringify(addonIds),
      },
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    };

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        ...basePayload,
        payment_method_types: primaryPaymentMethods,
      });
    } catch (err) {
      if (shouldFallbackToCardOnly(err, primaryPaymentMethods)) {
        console.warn('Stripe payment method fallback activated: retrying with card only');
        session = await stripe.checkout.sessions.create({
          ...basePayload,
          payment_method_types: ['card'],
        });
      } else {
        throw err;
      }
    }

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error creating checkout session:', {
      message: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// GET /api/payments/session/:sessionId — verify payment and return license info
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      res.status(402).json({ error: 'Payment not completed' });
      return;
    }

    // Fetch the generated license key for this session
    const { data: license, error } = await supabase
      .from('licenses')
      .select('key, product, plan_name, expires_at, customer_name, customer_email')
      .eq('stripe_session_id', sessionId)
      .single();

    if (error || !license) {
      res.status(404).json({ error: 'License not found yet. Please wait a moment.' });
      return;
    }

    res.json({ license });
  } catch (err) {
    console.error('Session retrieve error:', err);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

export default router;

function getPaymentMethodTypes(): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const configured = (process.env.STRIPE_PAYMENT_METHOD_TYPES ?? 'card')
    .split(',')
    .map((method) => method.trim().toLowerCase())
    .filter((method): method is Stripe.Checkout.SessionCreateParams.PaymentMethodType =>
      ALLOWED_PAYMENT_METHOD_TYPES.includes(method as Stripe.Checkout.SessionCreateParams.PaymentMethodType)
    );

  if (configured.length === 0) {
    return ['card'];
  }

  // Ensure deterministic order and avoid duplicates.
  return Array.from(new Set(configured));
}

function shouldFallbackToCardOnly(
  err: unknown,
  requestedMethods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[]
): boolean {
  if (!requestedMethods.includes('fpx')) {
    return false;
  }

  if (!(err instanceof Stripe.errors.StripeError)) {
    return false;
  }

  const message = (err.message ?? '').toLowerCase();
  return message.includes('fpx') || message.includes('payment_method_types');
}
