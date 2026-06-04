'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faSpinner, faDesktop, faMobileScreen, faKey,
  faClock, faLaptop, faCircleCheck, faCircleXmark, faPauseCircle,
  faExclamationTriangle, faRightLeft, faBan,
} from '@fortawesome/free-solid-svg-icons';
import supabase from '@/lib/supabase';
import toast from 'react-hot-toast';

interface PortalActivation {
  id: string;
  device_id: string;
  status: string;
  first_activated_at: string | null;
  last_validated_at: string | null;
}

interface PortalLicenseDetail {
  license_key: string;
  credential_status: string;
  issued_at: string;
  entitlement: {
    id: string;
    status: string;
    expires_at: string;
    starts_at: string;
    product: 'ezpos' | 'crossxpos';
    product_name: string;
    plan_code: string;
    plan_name: string;
  };
  activations: PortalActivation[];
}

async function portalFetch(path: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function portalPost(path: string, body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function PortalLicenseDetailPage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<PortalLicenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const licenseKey = decodeURIComponent(key);

  useEffect(() => {
    portalFetch(`/api/portal/license/${encodeURIComponent(licenseKey)}`)
      .then(setDetail)
      .catch(() => { toast.error('License not found'); router.push('/portal/dashboard'); })
      .finally(() => setLoading(false));
  }, [licenseKey, router]);

  async function handleTransferRequest() {
    if (!transferReason.trim()) return;
    setTransferLoading(true);
    try {
      await portalPost('/api/portal/transfer-request', {
        license_key: licenseKey,
        reason: transferReason.trim(),
      });
      toast.success('Transfer request submitted. Our team will review within 1 business day.');
      setShowTransfer(false);
      setTransferReason('');
    } catch {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setTransferLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!detail) return null;

  const { entitlement } = detail;
  const isLifetime = entitlement.product === 'ezpos';
  const expired = !isLifetime && new Date(entitlement.expires_at) < new Date();
  const daysLeft = isLifetime ? Infinity : Math.ceil((new Date(entitlement.expires_at).getTime() - Date.now()) / 86_400_000);
  const activeDevices = detail.activations.filter(a => a.status === 'active');

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link href="/portal/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
        Back to My Licenses
      </Link>

      {/* License card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${entitlement.product === 'ezpos' ? 'bg-ezpos-light' : 'bg-crossx-light'}`}>
            <FontAwesomeIcon icon={entitlement.product === 'ezpos' ? faDesktop : faMobileScreen} className={`w-6 h-6 ${entitlement.product === 'ezpos' ? 'text-ezpos' : 'text-crossx'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-gray-900">{entitlement.product_name}</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{entitlement.plan_name}</span>
            </div>
            <p className="font-mono text-xs text-gray-500 mb-3">{detail.license_key}</p>

            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500">
                <FontAwesomeIcon icon={
                  entitlement.status === 'active' ? faCircleCheck :
                  entitlement.status === 'suspended' ? faPauseCircle : faCircleXmark
                } className={`w-3.5 h-3.5 ${entitlement.status === 'active' ? 'text-green-500' : entitlement.status === 'suspended' ? 'text-amber-500' : 'text-red-500'}`} />
                Status: <strong className="text-gray-700 capitalize">{entitlement.status}</strong>
              </div>
              <div className={`flex items-center gap-1.5 ${expired ? 'text-red-500' : daysLeft <= 14 ? 'text-amber-600' : 'text-gray-500'}`}>
                <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
                {isLifetime
                  ? 'Lifetime License'
                  : expired
                    ? `Expired ${new Date(entitlement.expires_at).toLocaleDateString()}`
                    : `Expires ${new Date(entitlement.expires_at).toLocaleDateString()}`
                }
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <FontAwesomeIcon icon={faKey} className="w-3.5 h-3.5" />
                Issued {new Date(detail.issued_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <FontAwesomeIcon icon={faLaptop} className="w-3.5 h-3.5" />
                {activeDevices.length} active device{activeDevices.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Banners */}
        {entitlement.status === 'suspended' && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 shrink-0" />
            License suspended. Contact <strong className="mx-1">support@ezpos.my</strong> to reinstate.
          </div>
        )}
      </div>

      {/* Active devices */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FontAwesomeIcon icon={faLaptop} className="w-4 h-4 text-brand-600" />
          Active Devices
        </h2>

        {activeDevices.length === 0 && (
          <p className="text-sm text-gray-400">No active devices.</p>
        )}

        <div className="space-y-2">
          {activeDevices.map(act => (
            <div key={act.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50">
              <div>
                <p className="font-mono text-xs text-gray-700">{act.device_id}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  First activated: {act.first_activated_at ? new Date(act.first_activated_at).toLocaleDateString() : '—'}
                  {act.last_validated_at && <> · Last seen: {new Date(act.last_validated_at).toLocaleDateString()}</>}
                </p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transfer request */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <FontAwesomeIcon icon={faRightLeft} className="w-4 h-4 text-brand-600" />
          Transfer to New Device
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Need to move your license to a different device? Submit a transfer request and our team will process it within 1 business day.
        </p>

        {!showTransfer ? (
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 px-4 py-2.5 rounded-xl border border-brand-200 hover:bg-brand-50 transition-colors"
          >
            <FontAwesomeIcon icon={faRightLeft} className="w-3.5 h-3.5" />
            Request Transfer
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reason for transfer
              </label>
              <textarea
                value={transferReason}
                onChange={e => setTransferReason(e.target.value)}
                rows={3}
                placeholder="e.g. Old device damaged, replaced with new laptop…"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTransferRequest}
                disabled={transferLoading || !transferReason.trim()}
                className="flex items-center gap-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={transferLoading ? faSpinner : faRightLeft} className={`w-3.5 h-3.5 ${transferLoading ? 'animate-spin' : ''}`} />
                Submit Request
              </button>
              <button
                onClick={() => { setShowTransfer(false); setTransferReason(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
