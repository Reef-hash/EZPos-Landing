import { Router, Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { sendLicenseEmail, sendEntitlementStatusEmail } from '../lib/email';
import { logSecurityEvent, webhookInvalidSignatureMessage } from '../lib/securityLog';
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
    void logSecurityEvent({
      type: 'webhook_signature_invalid',
      severity: 'medium',
      req,
      message: webhookInvalidSignatureMessage(req.ip ?? 'unknown'),
    });
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          await handleSuccessfulPayment(event.id, session);
        }
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await handleInvoicePaid(invoice);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await handleInvoicePaymentFailed(invoice);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
    }
  } catch (err) {
    console.error('[Stripe webhook] processing failed', {
      eventId: event.id,
      eventType: event.type,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: 'Webhook processing failed' });
    return;
  }

  res.json({ received: true });
});

async function handleSuccessfulPayment(eventId: string, session: Stripe.Checkout.Session) {
  const { planId, product, customerName, planName, addonIds } = session.metadata as Record<string, string>;
  const customerEmail = session.customer_email!;

  // Idempotency guard: if a sale already exists for this Stripe session, skip.
  const { data: existingSale, error: existingSaleError } = await supabase
    .from('sales')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle();

  if (existingSaleError) {
    throw new Error(`Failed idempotency lookup: ${existingSaleError.message}`);
  }

  if (existingSale) {
    console.log('[Stripe webhook] duplicate event ignored', {
      eventId,
      stripeSessionId: session.id,
    });
    return;
  }

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

  const { error: licenseInsertError } = await supabase.from('licenses').insert({
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

  if (licenseInsertError && !isDuplicateKeyError(licenseInsertError)) {
    throw new Error(`License insert failed: ${licenseInsertError.message}`);
  }

  // Record sale
  const { error: saleInsertError } = await supabase.from('sales').insert({
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

  if (saleInsertError && !isDuplicateKeyError(saleInsertError)) {
    throw new Error(`Sale insert failed: ${saleInsertError.message}`);
  }

  if (saleInsertError || licenseInsertError) {
    console.log('[Stripe webhook] duplicate insert safely ignored', {
      eventId,
      stripeSessionId: session.id,
    });
  }

  // V1 licensing records — non-fatal if fails
  try {
    await createV1LicensingRecords({
      customerEmail,
      customerName,
      product,
      planName,
      pricingPlanId: planId,
      licenseKey,
      expiresAt: expiresAt.toISOString(),
      stripeSessionId: session.id,
      stripeSubscriptionId: session.subscription as string | null,
    });
  } catch (err) {
    console.error('[V1] Failed to create V1 licensing records (non-fatal)', err);
  }

  // Send license key email — non-fatal if fails
  try {
    await sendLicenseEmail({
      to: customerEmail,
      customerName,
      product,
      planName,
      licenseKey,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('[email] Failed to send license email (non-fatal)', err);
  }
}

// ─── V1 Record Creation ────────────────────────────────────────────────────

interface V1RecordParams {
  customerEmail: string;
  customerName: string;
  product: string;
  planName: string;
  pricingPlanId: string;
  licenseKey: string;
  expiresAt: string;
  stripeSessionId: string;
  stripeSubscriptionId: string | null;
}

async function createV1LicensingRecords(params: V1RecordParams): Promise<void> {
  const {
    customerEmail, customerName, product, planName,
    pricingPlanId, licenseKey, expiresAt, stripeSubscriptionId,
  } = params;

  // 1. Upsert product
  const { data: productRow } = await supabase
    .from('products')
    .select('id')
    .eq('code', product)
    .maybeSingle();

  if (!productRow) {
    console.warn('[V1] Product not found in products table:', product);
    return;
  }

  // 2. Find V1 plan — match by product_id + pricing_plan_id stored in metadata, or by name fallback
  const planCodeDerived = planName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const { data: planRow } = await supabase
    .from('plans')
    .select('id')
    .eq('product_id', productRow.id)
    .eq('code', planCodeDerived)
    .maybeSingle();

  // 2b. Fallback: any plan for this product
  let planId = planRow?.id;
  if (!planId) {
    const { data: fallbackPlan } = await supabase
      .from('plans')
      .select('id')
      .eq('product_id', productRow.id)
      .limit(1)
      .maybeSingle();
    planId = fallbackPlan?.id;
  }

  if (!planId) {
    console.warn('[V1] No matching plan found for product', product, 'plan', planName);
    return;
  }

  // 3. Upsert customer by email
  let customerId: string;
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', customerEmail)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: customerErr } = await supabase
      .from('customers')
      .insert({ name: customerName, email: customerEmail })
      .select('id')
      .single();
    if (customerErr || !newCustomer) throw new Error(`Customer insert failed: ${customerErr?.message}`);
    customerId = newCustomer.id;
  }

  // 4. Create entitlement
  const { data: entitlement, error: entitlementErr } = await supabase
    .from('entitlements')
    .insert({
      customer_id: customerId,
      product_id: productRow.id,
      plan_id: planId,
      status: 'active',
      starts_at: new Date().toISOString(),
      expires_at: expiresAt,
      metadata_json: { pricing_plan_id: pricingPlanId },
    })
    .select('id')
    .single();

  if (entitlementErr || !entitlement) throw new Error(`Entitlement insert failed: ${entitlementErr?.message}`);

  // 5. Create license credential
  const { error: credErr } = await supabase
    .from('license_credentials')
    .insert({
      entitlement_id: entitlement.id,
      license_key: licenseKey,
      status: 'active',
    });

  if (credErr && !isDuplicateKeyError(credErr)) throw new Error(`Credential insert failed: ${credErr.message}`);

  // 6. Create subscription record if Stripe subscription exists (recurring plans)
  if (stripeSubscriptionId) {
    await supabase.from('subscriptions').insert({
      entitlement_id: entitlement.id,
      provider: 'stripe',
      provider_subscription_id: stripeSubscriptionId,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: expiresAt,
    }).throwOnError();
  }

  // 7. Audit event
  await supabase.from('audit_events').insert({
    actor_type: 'webhook',
    actor_id: 'stripe',
    action: 'purchase_completed',
    entity_type: 'entitlement',
    entity_id: entitlement.id,
    payload_json: { license_key: licenseKey, product, plan: planName },
  });

  console.log('[V1] Records created for', customerEmail, '— key:', licenseKey);
}

// ─── Subscription Lifecycle Handlers ──────────────────────────────────────

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, entitlement_id')
    .eq('provider_subscription_id', subscriptionId)
    .maybeSingle();

  if (!sub) {
    console.warn('[V1] invoice.paid — no matching subscription:', subscriptionId);
    return;
  }

  const periodEnd = new Date((invoice.lines.data[0]?.period?.end ?? 0) * 1000).toISOString();

  await supabase.from('entitlements')
    .update({ status: 'active', expires_at: periodEnd, updated_at: new Date().toISOString() })
    .eq('id', sub.entitlement_id);

  await supabase.from('subscriptions')
    .update({ status: 'active', current_period_end: periodEnd, updated_at: new Date().toISOString() })
    .eq('id', sub.id);

  await supabase.from('audit_events').insert({
    actor_type: 'webhook',
    actor_id: 'stripe',
    action: 'subscription_renewed',
    entity_type: 'entitlement',
    entity_id: sub.entitlement_id,
    payload_json: { new_expires_at: periodEnd, stripe_subscription_id: subscriptionId },
  });

  console.log('[V1] Entitlement extended to', periodEnd, 'for subscription', subscriptionId);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, entitlement_id')
    .eq('provider_subscription_id', subscriptionId)
    .maybeSingle();

  if (!sub) return;

  await supabase.from('entitlements')
    .update({ status: 'suspended', updated_at: new Date().toISOString() })
    .eq('id', sub.entitlement_id);

  await supabase.from('subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('id', sub.id);

  await supabase.from('audit_events').insert({
    actor_type: 'webhook',
    actor_id: 'stripe',
    action: 'payment_failed_suspended',
    entity_type: 'entitlement',
    entity_id: sub.entitlement_id,
    payload_json: { stripe_subscription_id: subscriptionId },
  });

  // Notify customer
  try {
    const { data: ent } = await supabase
      .from('entitlements')
      .select('customers(name, email), products(code)')
      .eq('id', sub.entitlement_id)
      .single() as any;

    if (ent?.customers?.email) {
      await sendEntitlementStatusEmail({
        to: ent.customers.email,
        customerName: ent.customers.name,
        product: ent.products?.code ?? '',
        action: 'suspended',
      });
    }
  } catch { /* non-fatal */ }

  console.log('[V1] Entitlement suspended — payment failed for subscription', subscriptionId);
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription): Promise<void> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, entitlement_id')
    .eq('provider_subscription_id', stripeSub.id)
    .maybeSingle();

  if (!sub) return;

  await supabase.from('entitlements')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('id', sub.entitlement_id);

  await supabase.from('subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', sub.id);

  await supabase.from('audit_events').insert({
    actor_type: 'webhook',
    actor_id: 'stripe',
    action: 'subscription_cancelled',
    entity_type: 'entitlement',
    entity_id: sub.entitlement_id,
    payload_json: { stripe_subscription_id: stripeSub.id },
  });

  // Notify customer
  try {
    const { data: ent } = await supabase
      .from('entitlements')
      .select('customers(name, email), products(code)')
      .eq('id', sub.entitlement_id)
      .single() as any;

    if (ent?.customers?.email) {
      await sendEntitlementStatusEmail({
        to: ent.customers.email,
        customerName: ent.customers.name,
        product: ent.products?.code ?? '',
        action: 'revoked',
      });
    }
  } catch { /* non-fatal */ }

  console.log('[V1] Entitlement revoked — subscription deleted', stripeSub.id);
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  if (!charge.payment_intent) return;

  // Find license by payment_intent → get customer email → find entitlement
  const { data: license } = await supabase
    .from('licenses')
    .select('key, customer_email, product')
    .eq('stripe_payment_intent', charge.payment_intent as string)
    .maybeSingle();

  if (!license) return;

  // Find license_credentials by key → get entitlement
  const { data: cred } = await supabase
    .from('license_credentials')
    .select('id, entitlement_id')
    .eq('license_key', license.key)
    .maybeSingle();

  if (!cred) return;

  await supabase.from('entitlements')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('id', cred.entitlement_id);

  await supabase.from('license_credentials')
    .update({ status: 'revoked', revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', cred.id);

  await supabase.from('audit_events').insert({
    actor_type: 'webhook',
    actor_id: 'stripe',
    action: 'refund_revoked',
    entity_type: 'entitlement',
    entity_id: cred.entitlement_id,
    payload_json: { payment_intent: charge.payment_intent, license_key: license.key },
  });

  console.log('[V1] Entitlement revoked — refund for', license.key);
}

const LICENSE_KEY_PREFIX: Record<string, string> = {
  ezpos: 'EZP',
  crossxpos: 'CXP',
  ezoffice: 'EZO',
};

function generateLicenseKey(product: string, plan: string): string {
  const prefix = LICENSE_KEY_PREFIX[product] ?? product.toUpperCase().substring(0, 3);
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

function isDuplicateKeyError(error: { code?: string; message?: string }): boolean {
  return error.code === '23505' || /duplicate key/i.test(error.message ?? '');
}

export default router;
