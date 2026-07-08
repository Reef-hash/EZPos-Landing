-- EZOffice Onboarding — adds EZOffice as a third product on the existing
-- EZPos-Web licensing platform (V1 licensing tables + legacy commerce tables).
-- Run AFTER supabase-schema.sql, supabase-licensing-v1.sql, and
-- supabase-licensing-v1-backfill.sql have already been applied.
--
-- Locked decisions (see docs/LICENSE_INTEGRATION_AUDIT.md in the EZOffice repo):
--   - offline_grace_days = 75 (payroll must survive weeks of factory-side outage;
--     EZPos/CrossxPos rows are untouched — this is EZOffice's own policy row)
--   - device_binding_mode = 'strict', seat_limit = 1 (one installation per company)
--   - Pricing seeded at RM 2,500 one-time per docs/SALES_LICENSING_FLOW.md — adjust
--     price_myr below if the project owner finalizes a different figure (open
--     decision O1 in the audit doc).

BEGIN;

-- 1. Loosen legacy CHECK constraints to allow the 'ezoffice' product code.
--    These tables predate the V1 licensing schema; the Stripe webhook
--    (handleSuccessfulPayment) still writes to them for every product, so
--    'ezoffice' must be an allowed value here or that insert throws before
--    the V1 records are ever created.
ALTER TABLE pricing_plans DROP CONSTRAINT pricing_plans_product_check;
ALTER TABLE pricing_plans ADD CONSTRAINT pricing_plans_product_check
  CHECK (product IN ('ezpos', 'crossxpos', 'ezoffice'));

ALTER TABLE licenses DROP CONSTRAINT licenses_product_check;
ALTER TABLE licenses ADD CONSTRAINT licenses_product_check
  CHECK (product IN ('ezpos', 'crossxpos', 'ezoffice'));

ALTER TABLE sales DROP CONSTRAINT sales_product_check;
ALTER TABLE sales ADD CONSTRAINT sales_product_check
  CHECK (product IN ('ezpos', 'crossxpos', 'ezoffice'));

ALTER TABLE addons DROP CONSTRAINT addons_product_check;
ALTER TABLE addons ADD CONSTRAINT addons_product_check
  CHECK (product IN ('ezpos', 'crossxpos', 'ezoffice', 'all'));

-- 2. Register the product in the V1 catalog.
INSERT INTO products (code, name)
VALUES ('ezoffice', 'EZOffice')
ON CONFLICT (code) DO NOTHING;

-- 3. Seed a legacy pricing_plans row so the existing /api/pricing + Stripe
--    checkout flow (payments.ts) works for EZOffice without any endpoint
--    changes beyond widening the product enum.
INSERT INTO pricing_plans (
  product, product_label, name, description, price_myr, duration_days,
  features, is_active, is_popular, sort_order
) VALUES (
  'ezoffice', 'EZOffice', 'Standard',
  'Attendance + Payroll system for Malaysian SMEs (offline-first desktop app)',
  2500.00, 36500,
  ARRAY[
    'Fingerprint attendance (ZKTeco integration)',
    'Monthly payroll (EPF, SOCSO, EIS, PCB)',
    'Salary advances tracking',
    'Master data (employees, customers, suppliers, products)',
    'Admin audit trail',
    'One-time license — works fully offline',
    'Email support'
  ],
  true, false, 1
)
ON CONFLICT DO NOTHING;

-- 4. V1 plan row mirroring the pricing_plans row above (same billing_model
--    convention as the existing backfill: perpetual, code derived from name).
INSERT INTO plans (product_id, code, name, billing_model)
SELECT p.id, 'standard', 'Standard', 'perpetual'
FROM products p
WHERE p.code = 'ezoffice'
ON CONFLICT (product_id, code) DO NOTHING;

-- 5. Policy profile — EZOffice's own row, does not touch EZPos/CrossxPos rows.
--    75-day offline grace (vs EZPos's 7, CrossxPos's 3) because this is a
--    payroll app: it must keep running through weeks of factory-side internet
--    outage. Strict binding + seat_limit=1 matches EZPos's precedent — one
--    company runs one installation.
INSERT INTO product_policy_profiles (
  product_id, device_binding_mode, seat_limit,
  offline_grace_days, revalidate_after_hours, transfer_mode
)
SELECT p.id, 'strict', 1, 75, 36, 'admin_mediated'
FROM products p
WHERE p.code = 'ezoffice'
ON CONFLICT (product_id) DO NOTHING;

COMMIT;