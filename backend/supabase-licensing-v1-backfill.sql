-- EZPos-Web Licensing V1 Backfill Draft
-- Run AFTER supabase-licensing-v1.sql
-- Purpose: populate V1 licensing tables from the current commerce tables.
-- Safe to review first before production execution.

BEGIN;

-- 1. Products
INSERT INTO products (code, name)
VALUES
  ('ezpos', 'EZPos Desktop'),
  ('crossxpos', 'CrossxPos')
ON CONFLICT (code) DO NOTHING;

-- 2. Plans from existing pricing_plans
INSERT INTO plans (product_id, code, name, billing_model)
SELECT
  p.id,
  lower(regexp_replace(pp.name, '[^a-zA-Z0-9]+', '-', 'g')) AS code,
  pp.name,
  'perpetual'
FROM pricing_plans pp
JOIN products p ON p.code = pp.product
ON CONFLICT (product_id, code) DO NOTHING;

-- 3. Customers from existing licenses
INSERT INTO customers (name, email)
SELECT DISTINCT
  l.customer_name,
  NULLIF(l.customer_email, '')
FROM licenses l
ON CONFLICT DO NOTHING;

-- 4. Default product policy profiles
INSERT INTO product_policy_profiles (
  product_id,
  device_binding_mode,
  seat_limit,
  offline_grace_days,
  revalidate_after_hours,
  transfer_mode
)
SELECT p.id,
  CASE WHEN p.code = 'ezpos' THEN 'strict' ELSE 'flexible' END,
  CASE WHEN p.code = 'ezpos' THEN 1 ELSE 3 END,
  CASE WHEN p.code = 'ezpos' THEN 7 ELSE 3 END,
  CASE WHEN p.code = 'ezpos' THEN 24 ELSE 12 END,
  CASE WHEN p.code = 'ezpos' THEN 'admin_mediated' ELSE 'self_service' END
FROM products p
ON CONFLICT (product_id) DO NOTHING;

-- 5. Entitlements from existing licenses
INSERT INTO entitlements (
  customer_id,
  product_id,
  plan_id,
  status,
  starts_at,
  expires_at,
  metadata_json
)
SELECT
  c.id,
  pr.id,
  pl.id,
  CASE
    WHEN l.is_active = false THEN 'revoked'
    WHEN l.expires_at < NOW() THEN 'expired'
    ELSE 'active'
  END,
  l.created_at,
  l.expires_at,
  jsonb_build_object(
    'legacy_license_id', l.id,
    'legacy_plan_id', l.plan_id,
    'source', 'licenses-backfill'
  )
FROM licenses l
JOIN customers c
  ON c.name = l.customer_name
 AND COALESCE(c.email, '') = COALESCE(NULLIF(l.customer_email, ''), '')
JOIN products pr
  ON pr.code = l.product
JOIN plans pl
  ON pl.product_id = pr.id
 AND pl.name = l.plan_name
WHERE NOT EXISTS (
  SELECT 1
  FROM entitlements e
  WHERE (e.metadata_json ->> 'legacy_license_id')::uuid = l.id
);

-- 6. License credentials from existing licenses
INSERT INTO license_credentials (
  entitlement_id,
  license_key,
  status,
  issued_at,
  revoked_at
)
SELECT
  e.id,
  l.key,
  CASE
    WHEN l.is_active = false THEN 'revoked'
    WHEN l.expires_at < NOW() THEN 'expired'
    ELSE 'active'
  END,
  l.created_at,
  CASE WHEN l.is_active = false THEN NOW() ELSE NULL END
FROM licenses l
JOIN entitlements e
  ON (e.metadata_json ->> 'legacy_license_id')::uuid = l.id
ON CONFLICT (license_key) DO NOTHING;

-- 7. Validation event seed for imported active licenses (optional audit baseline)
INSERT INTO validation_events (
  entitlement_id,
  decision,
  status,
  reason_code,
  client_action,
  request_ip,
  user_agent
)
SELECT
  e.id,
  CASE WHEN lc.status = 'active' THEN 'allow' ELSE 'deny' END,
  CASE
    WHEN lc.status = 'active' THEN 'valid'
    WHEN lc.status = 'expired' THEN 'expired'
    ELSE 'revoked'
  END,
  CASE
    WHEN lc.status = 'active' THEN 'BACKFILL_ACTIVE'
    WHEN lc.status = 'expired' THEN 'BACKFILL_EXPIRED'
    ELSE 'BACKFILL_REVOKED'
  END,
  'none',
  NULL,
  'backfill-script'
FROM license_credentials lc
JOIN entitlements e ON e.id = lc.entitlement_id
WHERE NOT EXISTS (
  SELECT 1
  FROM validation_events ve
  WHERE ve.entitlement_id = e.id
);

COMMIT;
