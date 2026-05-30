export interface PricingPlan {
  id: string;
  product: 'ezpos' | 'crossxpos';
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
  product: 'ezpos' | 'crossxpos';
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
  product: 'ezpos' | 'crossxpos';
  plan_id: string;
  plan_name: string;
  customer_name: string;
  customer_email: string;
  amount_myr: number;
  addons_json: Array<{ id: string; name: string; price_myr: number }>;
  stripe_session_id: string;
  paid_at: string;
}

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
