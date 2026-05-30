-- EZPos Web — Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PRICING PLANS ───────────────────────────────────────────────────────────
CREATE TABLE pricing_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product       TEXT NOT NULL CHECK (product IN ('ezpos', 'crossxpos')),
  product_label TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price_myr     NUMERIC(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 365,
  features      TEXT[] NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_popular    BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── LICENSES ────────────────────────────────────────────────────────────────
CREATE TABLE licenses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key                   TEXT UNIQUE NOT NULL,
  product               TEXT NOT NULL CHECK (product IN ('ezpos', 'crossxpos')),
  plan_id               UUID REFERENCES pricing_plans(id),
  plan_name             TEXT NOT NULL,
  customer_name         TEXT NOT NULL,
  customer_email        TEXT NOT NULL,
  stripe_session_id     TEXT UNIQUE,
  stripe_payment_intent TEXT,
  addons_json           JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at            TIMESTAMPTZ NOT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SALES ───────────────────────────────────────────────────────────────────
CREATE TABLE sales (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product           TEXT NOT NULL CHECK (product IN ('ezpos', 'crossxpos')),
  plan_id           UUID REFERENCES pricing_plans(id),
  plan_name         TEXT NOT NULL,
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  amount_myr        NUMERIC(10, 2) NOT NULL,
  addons_json       JSONB NOT NULL DEFAULT '[]'::jsonb,
  stripe_session_id TEXT UNIQUE,
  paid_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ADD-ONS ────────────────────────────────────────────────────────────────
CREATE TABLE addons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product     TEXT NOT NULL CHECK (product IN ('ezpos', 'crossxpos', 'all')),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url   TEXT,
  price_myr   NUMERIC(10, 2) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SEED: Default Pricing Plans ─────────────────────────────────────────────
INSERT INTO pricing_plans (product, product_label, name, description, price_myr, duration_days, features, is_active, is_popular, sort_order) VALUES
-- EZPos (Desktop Retail POS)
('ezpos', 'EZPos Desktop', 'Standard', 'Complete retail POS for daily operations', 599.00, 365,
  ARRAY['1 Windows PC', 'Barcode scanning', 'Sales & stock management', 'Receipt printing (ESC/POS)', '1 year license', 'Email support'], true, false, 1),
('ezpos', 'EZPos Desktop', 'Business', 'Includes accounting system and cloud backup (coming soon)', 1400.00, 365,
  ARRAY['Up to 3 Windows PCs', 'All Standard features', 'Sales reports & analytics', 'Low stock alerts', 'Accounting integration (soon)', 'Cloud backup (soon)', 'Priority support'], true, true, 2),

-- CrossxPos (Restaurant POS)
('crossxpos', 'CrossxPos', 'Standard', 'Ideal for small cafes & eateries', 499.00, 365,
  ARRAY['Up to 3 staff', 'Up to 10 tables', 'Up to 50 menu items', 'KOT & cashier flow', 'Kitchen display', '1 year license', 'Email support'], true, false, 1),
('crossxpos', 'CrossxPos', 'Pro', 'For busy restaurants & F&B chains', 699.00, 365,
  ARRAY['Up to 15 staff', 'Unlimited tables', 'Unlimited menu items', 'All Standard features', 'Reports & CSV export', 'Shift management', 'Multi-device operations (tablet + cashier)', 'ESC/POS printing', 'Priority support'], true, true, 2);
