-- EZPos-Web Licensing V1 Schema Draft
-- Purpose: initial central licensing authority schema
-- Note: draft migration; review with product/ops before applying to production.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core catalog
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  billing_model TEXT NOT NULL CHECK (billing_model IN ('perpetual', 'subscription')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, code)
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Policy profile per product (optional plan-level override later)
CREATE TABLE IF NOT EXISTS product_policy_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) UNIQUE,
  device_binding_mode TEXT NOT NULL CHECK (device_binding_mode IN ('strict', 'flexible')),
  seat_limit INTEGER NOT NULL DEFAULT 1,
  offline_grace_days INTEGER NOT NULL DEFAULT 7,
  revalidate_after_hours INTEGER NOT NULL DEFAULT 24,
  transfer_mode TEXT NOT NULL CHECK (transfer_mode IN ('admin_mediated', 'self_service')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entitlement lifecycle
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'suspended', 'revoked', 'expired')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS license_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entitlement_id UUID NOT NULL REFERENCES entitlements(id),
  license_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Runtime activation and validation telemetry
CREATE TABLE IF NOT EXISTS activations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entitlement_id UUID NOT NULL REFERENCES entitlements(id),
  device_id TEXT NOT NULL,
  installation_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'released', 'blocked')),
  first_activated_at TIMESTAMPTZ,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entitlement_id, device_id)
);

CREATE TABLE IF NOT EXISTS validation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entitlement_id UUID REFERENCES entitlements(id),
  activation_id UUID REFERENCES activations(id),
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'deny', 'allow_temporarily')),
  status TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  client_action TEXT NOT NULL,
  request_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Billing mirror for lifecycle coupling
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entitlement_id UUID NOT NULL REFERENCES entitlements(id),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_subscription_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_subscription_id)
);

-- Operational controls and traceability
CREATE TABLE IF NOT EXISTS transfer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entitlement_id UUID NOT NULL REFERENCES entitlements(id),
  from_activation_id UUID REFERENCES activations(id),
  to_device_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('requested', 'approved', 'rejected', 'completed', 'expired')),
  requested_by TEXT,
  reviewed_by TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'customer', 'admin', 'support', 'webhook')),
  actor_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suggested indexes
CREATE INDEX IF NOT EXISTS idx_entitlements_customer_id ON entitlements(customer_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_product_id ON entitlements(product_id);
CREATE INDEX IF NOT EXISTS idx_activations_entitlement_id ON activations(entitlement_id);
CREATE INDEX IF NOT EXISTS idx_activations_device_id ON activations(device_id);
CREATE INDEX IF NOT EXISTS idx_validation_events_entitlement_id ON validation_events(entitlement_id);
CREATE INDEX IF NOT EXISTS idx_validation_events_created_at ON validation_events(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);
