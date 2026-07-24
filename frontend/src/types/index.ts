export interface PricingPlan {
  id: string;
  product: 'ezpos' | 'crossxpos' | 'ezoffice';
  product_label: string;
  name: string;
  description: string;
  price_myr: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
}

export interface AddonItem {
  id: string;
  product: 'ezpos' | 'crossxpos' | 'all';
  name: string;
  description: string;
  image_url?: string;
  price_myr: number;
  is_active: boolean;
  sort_order: number;
}

export interface License {
  id: string;
  key: string;
  product: 'ezpos' | 'crossxpos' | 'ezoffice';
  plan_id: string;
  plan_name: string;
  customer_name: string;
  customer_email: string;
  stripe_session_id: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface Sale {
  id: string;
  product: 'ezpos' | 'crossxpos' | 'ezoffice';
  plan_id: string;
  plan_name: string;
  customer_name: string;
  customer_email: string;
  amount_myr: number;
  addons_json: Array<{ id: string; name: string; price_myr: number }>;
  stripe_session_id: string;
  paid_at: string;
}

// ─── V1 Licensing Types ───────────────────────────────────────────────────────

export type EntitlementStatus = 'pending' | 'active' | 'suspended' | 'revoked' | 'expired';
export type CredentialStatus = 'active' | 'revoked' | 'expired';
export type ActivationStatus = 'pending' | 'active' | 'released' | 'blocked';
export type KeyType = 'production' | 'manual' | 'demo' | 'internal';

export interface V1License {
  id: string;
  license_key: string;
  credential_status: CredentialStatus;
  key_type: KeyType;
  entitlement_id: string;
  entitlement_status: EntitlementStatus;
  expires_at: string;
  customer_name: string;
  customer_email: string;
  product: 'ezpos' | 'crossxpos' | 'ezoffice';
  plan_name: string;
  plan_code: string;
  active_activations: number;
  issued_at: string;
  created_at: string;
}

export interface V1Activation {
  id: string;
  device_id: string;
  installation_id: string | null;
  status: ActivationStatus;
  first_activated_at: string | null;
  last_validated_at: string | null;
  created_at: string;
}

export interface V1ValidationEvent {
  id: string;
  decision: 'allow' | 'deny' | 'allow_temporarily';
  status: string;
  reason_code: string;
  client_action: string;
  request_ip: string | null;
  created_at: string;
}

export interface V1AuditEvent {
  id: string;
  actor_type: 'system' | 'customer' | 'admin' | 'support' | 'webhook';
  actor_id: string;
  action: string;
  payload_json: Record<string, unknown>;
  created_at: string;
}

export interface V1LicenseDetail {
  id: string;
  license_key: string;
  credential_status: CredentialStatus;
  issued_at: string;
  revoked_at: string | null;
  entitlement: {
    id: string;
    status: EntitlementStatus;
    expires_at: string;
    starts_at: string;
    customer: { id: string; name: string; email: string; phone: string | null };
    product: 'ezpos' | 'crossxpos' | 'ezoffice';
    product_name: string;
    plan_code: string;
    plan_name: string;
    billing_model: 'perpetual' | 'subscription';
  };
  activations: V1Activation[];
  validation_events: V1ValidationEvent[];
  audit_events: V1AuditEvent[];
}

export interface V1MonitoringStats {
  today: { total: number; allow: number; deny: number; successRate: number };
  last7days: { total: number; allow: number; deny: number; successRate: number };
  last30days: { total: number; allow: number; deny: number; successRate: number };
  topReasonCodes: Array<{ code: string; count: number }>;
  recentDenials: Array<{ reason_code: string; created_at: string }>;
}

// ─── Security Events ──────────────────────────────────────────────────────────

export type SecuritySeverity = 'info' | 'low' | 'medium' | 'high';

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: SecuritySeverity;
  ip: string | null;
  path: string | null;
  method: string | null;
  message: string;
  meta_json: Record<string, unknown>;
  created_at: string;
}

export interface SecuritySeverityCounts {
  total: number;
  info: number;
  low: number;
  medium: number;
  high: number;
}

export interface SecuritySummary {
  last24h: SecuritySeverityCounts;
  last7days: SecuritySeverityCounts;
  topIps: Array<{ ip: string; count: number }>;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalSales: number;
  ezposLicenses: number;
  crossxposLicenses: number;
  activePricingPlans: number;
}
