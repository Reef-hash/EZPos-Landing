'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey, faSpinner, faDesktop, faMobileScreen, faClock,
  faCircleCheck, faCircleXmark, faPauseCircle, faLaptop,
  faChevronRight, faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type EntitlementStatus = 'pending' | 'active' | 'suspended' | 'revoked' | 'expired';

interface PortalEntitlement {
  entitlement_id: string;
  entitlement_status: EntitlementStatus;
  expires_at: string;
  starts_at: string;
  product: 'ezpos' | 'crossxpos';
  product_name: string;
  plan_code: string;
  plan_name: string;
  license_key: string | null;
  credential_status: string | null;
  issued_at: string | null;
  active_activations: number;
  total_activations: number;
}

interface PortalMe {
  customer: { id: string; name: string; email: string };
  entitlements: PortalEntitlement[];
}

const STATUS_ICON: Record<EntitlementStatus, { icon: typeof faCircleCheck; cls: string; label: string }> = {
  active:    { icon: faCircleCheck,       cls: 'text-green-500',  label: 'Active' },
  expired:   { icon: faCircleXmark,       cls: 'text-red-500',    label: 'Expired' },
  revoked:   { icon: faCircleXmark,       cls: 'text-red-600',    label: 'Revoked' },
  suspended: { icon: faPauseCircle,       cls: 'text-amber-500',  label: 'Suspended' },
  pending:   { icon: faExclamationTriangle, cls: 'text-gray-400', label: 'Pending' },
};

async function getPortalSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export default function PortalDashboardPage() {
  const [data, setData] = useState<PortalMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await getPortalSession();
      if (!session) { setLoading(false); return; }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/portal/me`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch {
        toast.error('Failed to load your licenses');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-gray-900">
          {data?.customer.name ? `Welcome, ${data.customer.name.split(' ')[0]}` : 'My Licenses'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{data?.customer.email}</p>
      </div>

      {data?.entitlements.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FontAwesomeIcon icon={faKey} className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No licenses found for this account.</p>
          <p className="text-xs mt-1">
            Contact <span className="font-medium text-gray-500">support@ezpos.my</span> if you believe this is an error.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {(data?.entitlements ?? []).map(ent => {
          const st = STATUS_ICON[ent.entitlement_status] ?? STATUS_ICON.pending;
          const expired = new Date(ent.expires_at) < new Date();
          const daysLeft = Math.ceil((new Date(ent.expires_at).getTime() - Date.now()) / 86_400_000);

          return (
            <div key={ent.entitlement_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {/* Product icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ent.product === 'ezpos' ? 'bg-ezpos-light' : 'bg-crossx-light'}`}>
                    <FontAwesomeIcon icon={ent.product === 'ezpos' ? faDesktop : faMobileScreen} className={`w-5 h-5 ${ent.product === 'ezpos' ? 'text-ezpos' : 'text-crossx'}`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{ent.product_name}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{ent.plan_name}</span>
                    </div>

                    {ent.license_key && (
                      <p className="font-mono text-xs text-gray-500 mt-0.5">{ent.license_key}</p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5">
                      {/* Status */}
                      <span className={`flex items-center gap-1 text-xs font-medium ${st.cls}`}>
                        <FontAwesomeIcon icon={st.icon} className="w-3 h-3" />
                        {st.label}
                      </span>

                      {/* Expiry */}
                      <span className={`flex items-center gap-1 text-xs ${expired ? 'text-red-500' : daysLeft <= 14 ? 'text-amber-600' : 'text-gray-400'}`}>
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                        {expired
                          ? `Expired ${new Date(ent.expires_at).toLocaleDateString()}`
                          : `Expires ${new Date(ent.expires_at).toLocaleDateString()} (${daysLeft}d)`
                        }
                      </span>

                      {/* Active devices */}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <FontAwesomeIcon icon={faLaptop} className="w-3 h-3" />
                        {ent.active_activations} device{ent.active_activations !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detail link */}
                {ent.license_key && (
                  <Link
                    href={`/portal/license/${encodeURIComponent(ent.license_key)}`}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors"
                  >
                    Details
                    <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Warning banners */}
              {ent.entitlement_status === 'suspended' && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-700">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5 shrink-0" />
                  Your license is suspended. Contact <span className="font-semibold ml-1">support@ezpos.my</span> to reinstate.
                </div>
              )}
              {expired && ent.entitlement_status === 'active' && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5 shrink-0" />
                  This license has expired. Please renew to continue using the software.
                </div>
              )}
              {!expired && daysLeft <= 14 && ent.entitlement_status === 'active' && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-700">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5 shrink-0" />
                  Expiring in <strong className="mx-1">{daysLeft} days</strong> — renew soon to avoid service interruption.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
