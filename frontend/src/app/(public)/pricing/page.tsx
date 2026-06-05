'use client';

import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faArrowRight, faStar, faDesktop, faMobileScreen,
  faCreditCard, faBuildingColumns, faQrcode, faSpinner, faBoxesStacked,
  faRightToBracket, faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { AddonItem, PricingPlan } from '@/types';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabase';
import Link from 'next/link';

type ProductFilter = 'all' | 'ezpos' | 'crossxpos';
const CROSSXPOS_UNDER_DEVELOPMENT = true;

const FALLBACK_CORE_PLANS: PricingPlan[] = [
  {
    id: 'fallback-ezpos-standard',
    product: 'ezpos',
    product_label: 'EZPos Desktop',
    name: 'Standard',
    description: 'Complete retail POS for daily operations',
    price_myr: 599,
    duration_days: 36500,
    features: [
      '1 Windows PC',
      'Barcode scanning',
      'Sales & stock management',
      'Receipt printing (ESC/POS)',
      'Lifetime license',
      'Email support',
    ],
    is_active: true,
    is_popular: false,
    sort_order: 1,
  },
  {
    id: 'fallback-ezpos-business',
    product: 'ezpos',
    product_label: 'EZPos Desktop',
    name: 'Business',
    description: 'Includes accounting system and cloud backup (coming soon)',
    price_myr: 1400,
    duration_days: 36500,
    features: [
      'Up to 3 Windows PCs',
      'All Standard features',
      'Sales reports & analytics',
      'Accounting integration (soon)',
      'Cloud backup (soon)',
      'Priority support',
    ],
    is_active: true,
    is_popular: true,
    sort_order: 2,
  },
  {
    id: 'fallback-crossx-standard',
    product: 'crossxpos',
    product_label: 'CrossxPos',
    name: 'Standard',
    description: 'Ideal for small cafes & eateries',
    price_myr: 499,
    duration_days: 365,
    features: [
      'Up to 3 staff',
      'Up to 10 tables',
      'Up to 50 menu items',
      'KOT & cashier flow',
      'Kitchen display',
      '1 year license',
      'Email support',
    ],
    is_active: true,
    is_popular: false,
    sort_order: 1,
  },
  {
    id: 'fallback-crossx-pro',
    product: 'crossxpos',
    product_label: 'CrossxPos',
    name: 'Pro',
    description: 'For busy restaurants & F&B chains',
    price_myr: 699,
    duration_days: 365,
    features: [
      'Up to 15 staff',
      'Unlimited tables',
      'Unlimited menu items',
      'All Standard features',
      'Reports & CSV export',
      'Shift management',
      'Multi-device operations (tablet + cashier)',
      'ESC/POS printing',
      'Priority support',
    ],
    is_active: true,
    is_popular: true,
    sort_order: 2,
  },
];

export default function PricingPage() {
  const hasLoaded = useRef(false);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProductFilter>('all');
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [checkoutForm, setCheckoutForm] = useState<{ name: string; email: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [authPromptPlan, setAuthPromptPlan] = useState<PricingPlan | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    const product = new URLSearchParams(window.location.search).get('product') as ProductFilter | null;
    if (product === 'ezpos' || product === 'crossxpos' || product === 'all') {
      setActiveTab(product);
    }
  }, []);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    Promise.allSettled([
      api.get('/api/pricing'),
      api.get('/api/addons'),
    ])
      .then(([pricingResult, addonsResult]) => {
        if (pricingResult.status === 'fulfilled') {
          const apiPlans = pricingResult.value.data as PricingPlan[];
          if (Array.isArray(apiPlans) && apiPlans.length > 0) {
            setPlans(apiPlans);
          } else {
            setPlans(FALLBACK_CORE_PLANS);
          }
        } else {
          setPlans(FALLBACK_CORE_PLANS);
        }

        if (addonsResult.status === 'fulfilled') {
          setAddons(addonsResult.value.data);
        } else {
          // Keep core-only checkout usable even if add-ons API/table is unavailable.
          setAddons([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'all' ? plans : plans.filter(p => p.product === activeTab);
  const isCrossxPosBlocked = (product: PricingPlan['product']) =>
    CROSSXPOS_UNDER_DEVELOPMENT && product === 'crossxpos';

  const modalAddons = selectedPlan
    ? addons.filter(a => a.product === 'all' || a.product === selectedPlan.product)
    : [];
  const selectedAddons = modalAddons.filter(a => selectedAddonIds.includes(a.id));
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price_myr, 0);

  function toggleAddon(addonId: string) {
    setSelectedAddonIds(prev => prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]);
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan || !checkoutForm) return;
    setCheckingOut(selectedPlan.id);
    try {
      const res = await api.post('/api/payments/checkout', {
        planId: selectedPlan.id,
        product: selectedPlan.product,
        addonIds: selectedAddonIds,
        customerEmail: checkoutForm.email,
        customerName: checkoutForm.name,
      });
      window.location.href = res.data.url;
    } catch {
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <div className="section">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Pricing & Plans</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-6">
          Simple, transparent pricing. No hidden fees. Pay once or annually.
        </p>

        {/* Payment badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { icon: faCreditCard, label: 'Credit / Debit Card' },
            { icon: faBuildingColumns, label: 'FPX Online Banking' },
            { icon: faQrcode, label: 'QR Payment' },
          ].map(m => (
            <span key={m.label} className="badge bg-gray-100 text-gray-700 text-sm">
              <FontAwesomeIcon icon={m.icon} className="w-4 h-4 text-brand-600" />
              {m.label}
            </span>
          ))}
        </div>

        {/* Tab filter */}
        <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['all', 'ezpos', 'crossxpos'] as ProductFilter[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'ezpos' && <FontAwesomeIcon icon={faDesktop} className="w-4 h-4" />}
              {tab === 'crossxpos' && <FontAwesomeIcon icon={faMobileScreen} className="w-4 h-4" />}
              {tab === 'all' ? 'All Products' : tab === 'ezpos' ? 'EZPos Desktop' : 'CrossxPos'}
            </button>
          ))}
        </div>
        {CROSSXPOS_UNDER_DEVELOPMENT && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 inline-block">
            CrossxPos is currently under development. Purchasing is temporarily disabled.
          </p>
        )}
      </div>

      {/* Plans grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(plan => {
            const blocked = isCrossxPosBlocked(plan.product);
            return (
              <div
                key={plan.id}
                className={`card relative flex flex-col ${
                  plan.is_popular
                    ? plan.product === 'ezpos'
                      ? 'border-2 border-ezpos ring-2 ring-ezpos/10'
                      : 'border-2 border-crossx ring-2 ring-crossx/10'
                    : ''
                }`}
              >
                {plan.is_popular && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 badge text-white text-xs ${
                    plan.product === 'ezpos' ? 'bg-ezpos' : 'bg-crossx'
                  }`}>
                    <FontAwesomeIcon icon={faStar} className="w-3 h-3" /> Most Popular
                  </span>
                )}

                {/* Product badge */}
                <span className={`badge text-xs mb-3 w-fit ${
                  plan.product === 'ezpos' ? 'bg-ezpos-light text-ezpos' : 'bg-crossx-light text-crossx'
                }`}>
                  <FontAwesomeIcon icon={plan.product === 'ezpos' ? faDesktop : faMobileScreen} className="w-3 h-3" />
                  {plan.product_label}
                </span>
                {blocked && (
                  <span className="badge text-xs mb-3 w-fit bg-amber-50 text-amber-700 border border-amber-200">
                    Under Development
                  </span>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                <div className="mb-5">
                  <span className={`text-4xl font-extrabold ${plan.product === 'ezpos' ? 'text-ezpos' : 'text-crossx'}`}>
                    RM {plan.price_myr.toFixed(0)}
                  </span>
                  <span className="text-gray-400 text-sm ml-1">
                    {plan.duration_days >= 36000 ? '/ lifetime' : '/ year'}
                  </span>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <FontAwesomeIcon icon={faCheckCircle} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.product === 'ezpos' ? 'text-ezpos' : 'text-crossx'
                      }`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={async () => {
                    if (blocked) return;
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                      setAuthPromptPlan(plan);
                      return;
                    }
                    setUserEmail(session.user.email ?? null);
                    setCheckoutForm({ name: '', email: session.user.email ?? '' });
                    setSelectedPlan(plan);
                    setSelectedAddonIds([]);
                  }}
                  disabled={blocked}
                  className={`w-full btn-primary justify-center ${
                    blocked
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : plan.product === 'ezpos'
                      ? 'bg-ezpos hover:bg-ezpos-dark'
                      : 'bg-crossx hover:bg-crossx-dark'
                  }`}
                >
                  {blocked ? (
                    'Coming Soon'
                  ) : (
                    <>Buy Now <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Purchase — {selectedPlan.product_label} {selectedPlan.name}
            </h2>
            <p className="text-gray-500 text-sm mb-3">
              RM {selectedPlan.price_myr.toFixed(2)} {selectedPlan.duration_days >= 36000 ? '(lifetime)' : '/ year'}
            </p>
            <p className="text-xs text-gray-500 mb-5">
              Core product is ready by default. Add-ons are optional.
            </p>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Ahmad bin Ali"
                  value={checkoutForm?.name ?? ''}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  onChange={e => setCheckoutForm(p => ({ email: p?.email ?? '', name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={checkoutForm?.email ?? ''}
                  readOnly={!!userEmail}
                  className={`w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${userEmail ? 'bg-gray-50 text-gray-500 cursor-default' : ''}`}
                  onChange={e => setCheckoutForm(p => ({ name: p?.name ?? '', email: e.target.value }))}
                />
                {userEmail && (
                  <p className="text-xs text-gray-400 mt-1">Signed in as {userEmail}</p>
                )}
              </div>

              <p className="text-xs text-gray-400">
                Your license key will be emailed after payment. We accept card, FPX, and QR via Stripe.
              </p>

              {modalAddons.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FontAwesomeIcon icon={faBoxesStacked} className="w-4 h-4 text-brand-600" />
                    Optional Add-ons
                  </h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {modalAddons.map(addon => (
                      <label key={addon.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAddonIds.includes(addon.id)}
                          onChange={() => toggleAddon(addon.id)}
                          className="mt-1"
                        />
                        {addon.image_url ? (
                          <img src={addon.image_url} alt={addon.name} className="w-12 h-12 rounded-md object-cover border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{addon.name}</p>
                          <p className="text-xs text-gray-500">{addon.description}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">RM {addon.price_myr.toFixed(2)}</p>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Core product</span>
                  <span>RM {selectedPlan.price_myr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Add-ons</span>
                  <span>RM {addonsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span>RM {(selectedPlan.price_myr + addonsTotal).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 btn-outline border-gray-300 text-gray-600 hover:bg-gray-50 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkingOut === selectedPlan.id}
                  className={`flex-1 btn-primary justify-center ${
                    selectedPlan.product === 'ezpos' ? 'bg-ezpos hover:bg-ezpos-dark' : 'bg-crossx hover:bg-crossx-dark'
                  }`}
                >
                  {checkingOut === selectedPlan.id ? (
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Proceed to Payment <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Gate Modal — shown when guest clicks Buy Now */}
      {authPromptPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faRightToBracket} className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Sign in to purchase</h2>
            <p className="text-gray-500 text-sm mb-1">
              You need an account to buy <span className="font-semibold text-gray-700">{authPromptPlan.product_label} {authPromptPlan.name}</span>.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              Your license will be linked to your account so you can manage it anytime from the portal.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/portal/login?redirect=/pricing&plan=${authPromptPlan.id}`}
                className="flex items-center justify-center gap-2 w-full btn-primary py-2.5"
              >
                <FontAwesomeIcon icon={faRightToBracket} className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href={`/portal/login?tab=signup&redirect=/pricing&plan=${authPromptPlan.id}`}
                className="flex items-center justify-center gap-2 w-full btn-outline border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5"
              >
                <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
                Create Account
              </Link>
              <button
                onClick={() => setAuthPromptPlan(null)}
                className="text-sm text-gray-400 hover:text-gray-600 mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
